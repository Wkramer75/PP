import re
import time
import csv
import io
from urllib.parse import urlparse, urljoin
from collections import Counter

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.modules.scraping.models import ScrapedData, ScrapingJob

# ── Patterns ──────────────────────────────────────────────────────────────────
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(
    r"(?:\+?\d{1,3}[\s\-.]?)?"
    r"(?:\(?\d{1,4}\)?[\s\-.]?)?"
    r"\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}"
)

SOCIAL_DOMAINS = {
    "facebook.com": "facebook", "fb.com": "facebook",
    "twitter.com": "twitter", "x.com": "twitter",
    "linkedin.com": "linkedin", "instagram.com": "instagram",
    "youtube.com": "youtube", "tiktok.com": "tiktok",
    "pinterest.com": "pinterest", "github.com": "github",
    "t.me": "telegram", "wa.me": "whatsapp",
}

TECH_SIGNATURES = {
    "wp-content": "WordPress", "wp-includes": "WordPress",
    "Shopify": "Shopify", "shopify": "Shopify",
    "wix.com": "Wix", "squarespace": "Squarespace",
    "drupal": "Drupal", "joomla": "Joomla",
    "magento": "Magento", "prestashop": "PrestaShop",
    "webflow": "Webflow", "next/static": "Next.js", "__next": "Next.js",
    "__nuxt": "Nuxt.js", "gatsby": "Gatsby",
    "react": "React", "angular": "Angular",
    "vue.js": "Vue.js", "vue.min.js": "Vue.js",
    "jquery": "jQuery", "bootstrap": "Bootstrap", "tailwind": "Tailwind CSS",
    "google-analytics": "Google Analytics", "gtag": "Google Analytics",
    "gtm.js": "Google Tag Manager", "fbevents.js": "Facebook Pixel",
    "hotjar": "Hotjar", "cloudflare": "Cloudflare",
    "stripe.com": "Stripe", "recaptcha": "reCAPTCHA",
    "hubspot": "HubSpot", "intercom": "Intercom",
    "crisp.chat": "Crisp", "zendesk": "Zendesk",
    "mailchimp": "Mailchimp", "cookiebot": "Cookiebot",
    "matomo": "Matomo", "plausible": "Plausible",
}

FAKE_EMAIL_DOMAINS = {
    "example.com", "email.com", "yourdomain.com", "domain.com",
    "sentry.io", "wixpress.com", "test.com",
}


def _clean_nul(value):
    """Remove NUL (0x00) bytes that PostgreSQL text fields reject."""
    if isinstance(value, str):
        return value.replace("\x00", "")
    if isinstance(value, list):
        return [_clean_nul(v) for v in value]
    if isinstance(value, dict):
        return {k: _clean_nul(v) for k, v in value.items()}
    return value


# ── Selenium browser ─────────────────────────────────────────────────────────

def _create_driver() -> webdriver.Chrome:
    """Create a headless Chrome browser instance."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    )
    options.add_argument("--lang=fr-FR")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.page_load_strategy = "normal"

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(45)

    # Hide webdriver flag
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })

    return driver


def _fetch_page(url: str) -> tuple[str, str, int, float]:
    """
    Fetch a page using Selenium, wait for JS to render, return
    (html, current_url, status_code_approx, elapsed_seconds).
    """
    driver = _create_driver()
    start = time.time()
    try:
        driver.get(url)

        # Wait for body to be present (page loaded)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        # Extra wait for JS-heavy pages to render dynamic content
        time.sleep(2)

        # Try to dismiss cookie banners (common on FR sites)
        _try_dismiss_cookies(driver)

        # Scroll down to trigger lazy-loaded content
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
        time.sleep(1)

        html = driver.page_source
        final_url = driver.current_url
        elapsed = round(time.time() - start, 3)

        # Selenium doesn't give HTTP status directly; infer from page content
        status = 200
        if "404" in (driver.title or "") or "not found" in (driver.title or "").lower():
            status = 404

        return html, final_url, status, elapsed

    except TimeoutException:
        raise ValueError("Le site met trop de temps a repondre (timeout 45s)")
    except WebDriverException as e:
        msg = str(e)[:200]
        if "net::ERR_NAME_NOT_RESOLVED" in msg:
            raise ValueError("Impossible de trouver ce site. Verifiez l'URL.")
        elif "net::ERR_CONNECTION_REFUSED" in msg:
            raise ValueError("Connexion refusee par le site.")
        elif "net::ERR_CONNECTION_TIMED_OUT" in msg:
            raise ValueError("Le site ne repond pas (timeout).")
        else:
            raise ValueError(f"Erreur du navigateur: {msg}")
    finally:
        driver.quit()


def _try_dismiss_cookies(driver):
    """Try to click common cookie consent buttons."""
    selectors = [
        "button[id*='accept']", "button[id*='cookie']", "button[id*='consent']",
        "button[class*='accept']", "button[class*='cookie']", "button[class*='consent']",
        "a[id*='accept']", "#didomi-notice-agree-button", ".cc-accept",
        "[data-testid='cookie-accept']", "#onetrust-accept-btn-handler",
    ]
    for sel in selectors:
        try:
            btn = driver.find_element(By.CSS_SELECTOR, sel)
            if btn.is_displayed():
                btn.click()
                time.sleep(0.5)
                return
        except Exception:
            continue


# ── Extraction helpers ────────────────────────────────────────────────────────

def _extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower().replace("www.", "")


def _extract_emails(text: str, html: str) -> list[str]:
    emails = set(EMAIL_PATTERN.findall(text))
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        if a["href"].startswith("mailto:"):
            email = a["href"].replace("mailto:", "").split("?")[0].strip()
            if EMAIL_PATTERN.match(email):
                emails.add(email)
    filtered = []
    for e in emails:
        domain = e.split("@")[1].lower()
        if domain not in FAKE_EMAIL_DOMAINS and not e.endswith((".png", ".jpg", ".svg", ".gif")):
            filtered.append(e)
    return sorted(set(filtered))


def _extract_phones(text: str) -> list[str]:
    raw = PHONE_PATTERN.findall(text)
    phones = set()
    for p in raw:
        cleaned = p.strip()
        digit_count = sum(1 for c in cleaned if c.isdigit())
        if len(cleaned) >= 10 and digit_count >= 7:
            phones.add(cleaned)
    return sorted(phones)


def _extract_links(soup: BeautifulSoup, base_url: str) -> tuple[list[str], list[str], list[str]]:
    base_domain = _extract_domain(base_url)
    all_links, internal, external = [], [], []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("#", "javascript:", "tel:", "mailto:")):
            continue
        full_url = urljoin(base_url, href)
        if not full_url.startswith(("http://", "https://")):
            continue
        all_links.append(full_url)
        link_domain = _extract_domain(full_url)
        if link_domain == base_domain or link_domain.endswith("." + base_domain):
            internal.append(full_url)
        else:
            external.append(full_url)
    return sorted(set(all_links)), sorted(set(internal)), sorted(set(external))


def _extract_social_media(links: list[str]) -> dict:
    social = {}
    for link in links:
        domain = _extract_domain(link)
        for social_domain, platform in SOCIAL_DOMAINS.items():
            if social_domain in domain:
                if platform not in social:
                    social[platform] = link
                break
    return social


def _detect_technologies(soup: BeautifulSoup, html: str) -> list[str]:
    techs = set()
    html_lower = html.lower()
    for signature, tech in TECH_SIGNATURES.items():
        if signature.lower() in html_lower:
            techs.add(tech)
    generator = soup.find("meta", attrs={"name": "generator"})
    if generator and generator.get("content"):
        techs.add(generator["content"].split("/")[0].strip())
    return sorted(techs)


def _extract_meta(soup: BeautifulSoup) -> tuple[str | None, list[str], dict]:
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag["content"].strip() if desc_tag and desc_tag.get("content") else None
    kw_tag = soup.find("meta", attrs={"name": "keywords"})
    keywords = []
    if kw_tag and kw_tag.get("content"):
        keywords = [k.strip() for k in kw_tag["content"].split(",") if k.strip()]
    og = {}
    for tag in soup.find_all("meta", attrs={"property": True}):
        prop = tag.get("property", "")
        if prop.startswith("og:"):
            og[prop.replace("og:", "")] = tag.get("content", "")
    return desc, keywords, og


def _extract_images(soup: BeautifulSoup, base_url: str) -> list[str]:
    images = []
    for img in soup.find_all("img", src=True):
        src = urljoin(base_url, img["src"])
        if src.startswith(("http://", "https://")):
            images.append(src)
    return sorted(set(images))[:50]


def _detect_language(soup: BeautifulSoup) -> str | None:
    html_tag = soup.find("html")
    if html_tag and html_tag.get("lang"):
        return html_tag["lang"][:5]
    return None


# ── Main scraping function ────────────────────────────────────────────────────

def scrape_url(url: str, db: Session, depth: int = 0, parent_id: int | None = None) -> ScrapedData:
    """Scrape a URL using Selenium (headless Chrome), extract data, persist results."""
    html, final_url, status_code, elapsed = _fetch_page(str(url))

    soup = BeautifulSoup(html, "html.parser")

    title = soup.title.string.strip() if soup.title and soup.title.string else None
    text = soup.get_text(separator=" ", strip=True)
    domain = _extract_domain(final_url)

    emails = _extract_emails(text, html)
    phones = _extract_phones(text)
    all_links, internal, external = _extract_links(soup, final_url)
    social = _extract_social_media(all_links)
    techs = _detect_technologies(soup, html)
    desc, keywords, og = _extract_meta(soup)
    images = _extract_images(soup, final_url)
    lang = _detect_language(soup)
    word_count = len(text.split())

    record = ScrapedData(
        url=_clean_nul(str(url)),
        domain=_clean_nul(domain),
        title=_clean_nul(title),
        meta_description=_clean_nul(desc),
        meta_keywords=_clean_nul(keywords),
        og_data=_clean_nul(og),
        raw_content=_clean_nul(text[:50000]),
        extracted_emails=_clean_nul(emails),
        extracted_phones=_clean_nul(phones),
        extracted_links=_clean_nul(all_links[:200]),
        internal_links=_clean_nul(internal[:200]),
        external_links=_clean_nul(external[:200]),
        social_media=_clean_nul(social),
        technologies=_clean_nul(techs),
        images=_clean_nul(images),
        headers={},
        status_code=status_code,
        response_time=elapsed,
        word_count=word_count,
        language=_clean_nul(lang),
        is_deep_scrape=depth > 0,
        depth=depth,
        parent_scrape_id=parent_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def deep_scrape(url: str, db: Session, max_depth: int = 1) -> list[ScrapedData]:
    """Scrape a URL and follow internal links up to max_depth."""
    visited = set()
    results = []

    def _crawl(current_url: str, current_depth: int, parent_id: int | None):
        if current_depth > max_depth or current_url in visited or len(visited) > 20:
            return
        visited.add(current_url)
        try:
            record = scrape_url(current_url, db, depth=current_depth, parent_id=parent_id)
            results.append(record)
            if current_depth < max_depth:
                for link in (record.internal_links or [])[:5]:
                    _crawl(link, current_depth + 1, record.id)
        except Exception:
            pass

    _crawl(url, 0, None)
    return results


def batch_scrape(urls: list[str], db: Session, name: str | None = None,
                 deep: bool = False, max_depth: int = 1) -> ScrapingJob:
    """Scrape multiple URLs and track progress."""
    job = ScrapingJob(
        name=name or f"Batch ({len(urls)} URLs)",
        urls=urls,
        status="running",
        total_urls=len(urls),
        deep_scrape=deep,
        max_depth=max_depth,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    result_ids = []
    errors = []

    for url in urls:
        try:
            if deep:
                records = deep_scrape(url, db, max_depth)
                result_ids.extend([r.id for r in records])
            else:
                record = scrape_url(url, db)
                result_ids.append(record.id)
            job.completed_urls += 1
        except Exception as e:
            job.failed_urls += 1
            errors.append({"url": url, "error": str(e)})

    job.results = result_ids
    job.errors = errors
    job.status = "completed" if not errors else ("completed" if result_ids else "failed")
    job.completed_at = sa_func.now()
    db.commit()
    db.refresh(job)
    return job


# ── Query functions ───────────────────────────────────────────────────────────

def get_all_scrapes(db: Session, skip: int = 0, limit: int = 50) -> list[ScrapedData]:
    return (
        db.query(ScrapedData)
        .order_by(ScrapedData.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_scrape_by_id(db: Session, scrape_id: int) -> ScrapedData | None:
    return db.query(ScrapedData).filter(ScrapedData.id == scrape_id).first()


def delete_scrape(db: Session, scrape_id: int) -> bool:
    record = db.query(ScrapedData).filter(ScrapedData.id == scrape_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def search_scrapes(db: Session, query: str, skip: int = 0, limit: int = 50) -> list[ScrapedData]:
    return (
        db.query(ScrapedData)
        .filter(
            (ScrapedData.url.ilike(f"%{query}%"))
            | (ScrapedData.title.ilike(f"%{query}%"))
            | (ScrapedData.domain.ilike(f"%{query}%"))
        )
        .order_by(ScrapedData.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_scraping_stats(db: Session) -> dict:
    total = db.query(ScrapedData).count()
    scrapes = db.query(ScrapedData).all()

    all_emails, all_phones, all_links = 0, 0, 0
    domains = set()
    tech_counter = Counter()

    for s in scrapes:
        all_emails += len(s.extracted_emails or [])
        all_phones += len(s.extracted_phones or [])
        all_links += len(s.extracted_links or [])
        if s.domain:
            domains.add(s.domain)
        for t in (s.technologies or []):
            tech_counter[t] += 1

    top_techs = [{"name": k, "count": v} for k, v in tech_counter.most_common(10)]

    recent = (
        db.query(ScrapedData)
        .order_by(ScrapedData.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_scrapes": total,
        "total_emails": all_emails,
        "total_phones": all_phones,
        "total_links": all_links,
        "unique_domains": len(domains),
        "top_technologies": top_techs,
        "recent_scrapes": recent,
    }


def get_all_jobs(db: Session, skip: int = 0, limit: int = 20) -> list[ScrapingJob]:
    return (
        db.query(ScrapingJob)
        .order_by(ScrapingJob.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def export_scrapes_csv(db: Session, scrape_ids: list[int] | None = None) -> str:
    query = db.query(ScrapedData)
    if scrape_ids:
        query = query.filter(ScrapedData.id.in_(scrape_ids))
    scrapes = query.order_by(ScrapedData.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "URL", "Domain", "Title", "Emails", "Phones",
        "Social Media", "Technologies", "Status Code", "Date"
    ])
    for s in scrapes:
        writer.writerow([
            s.id, s.url, s.domain, s.title,
            "; ".join(s.extracted_emails or []),
            "; ".join(s.extracted_phones or []),
            "; ".join(f"{k}: {v}" for k, v in (s.social_media or {}).items()),
            "; ".join(s.technologies or []),
            s.status_code,
            s.created_at.isoformat() if s.created_at else "",
        ])
    return output.getvalue()
