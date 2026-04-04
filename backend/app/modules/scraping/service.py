import re
import time
import csv
import io
from urllib.parse import urlparse, urljoin
from collections import Counter

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
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

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}

FAKE_EMAIL_DOMAINS = {
    "example.com", "email.com", "yourdomain.com", "domain.com",
    "sentry.io", "wixpress.com", "test.com",
}


def _get_session() -> requests.Session:
    """Create a requests Session with retry logic."""
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update(HEADERS)
    return session


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


def _detect_technologies(soup: BeautifulSoup, html: str, response_headers: dict) -> list[str]:
    techs = set()
    html_lower = html.lower()
    for signature, tech in TECH_SIGNATURES.items():
        if signature.lower() in html_lower:
            techs.add(tech)
    generator = soup.find("meta", attrs={"name": "generator"})
    if generator and generator.get("content"):
        techs.add(generator["content"].split("/")[0].strip())
    server = response_headers.get("server", "")
    if server:
        techs.add(f"Server: {server}")
    powered_by = response_headers.get("x-powered-by", "")
    if powered_by:
        techs.add(powered_by)
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
    """Scrape a URL with full extraction, persist results."""
    session = _get_session()
    start_time = time.time()

    try:
        response = session.get(str(url), timeout=30, allow_redirects=True, verify=True)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise ValueError(f"Le site met trop de temps a repondre (timeout 30s)")
    except requests.exceptions.ConnectionError:
        raise ValueError(f"Impossible de se connecter au site. Verifiez l'URL.")
    except requests.exceptions.HTTPError as e:
        code = e.response.status_code if e.response is not None else "?"
        if code == 403:
            raise ValueError(f"Acces refuse par le site (403 Forbidden). Le site bloque les scrapers.")
        elif code == 404:
            raise ValueError(f"Page introuvable (404). Verifiez l'URL.")
        elif code == 429:
            raise ValueError(f"Trop de requetes (429). Reessayez plus tard.")
        else:
            raise ValueError(f"Erreur HTTP {code}")

    elapsed = round(time.time() - start_time, 3)

    # Handle encoding properly
    response.encoding = response.apparent_encoding or "utf-8"
    html = response.text
    soup = BeautifulSoup(html, "html.parser")

    title = soup.title.string.strip() if soup.title and soup.title.string else None
    text = soup.get_text(separator=" ", strip=True)
    domain = _extract_domain(url)

    emails = _extract_emails(text, html)
    phones = _extract_phones(text)
    all_links, internal, external = _extract_links(soup, url)
    social = _extract_social_media(all_links)
    techs = _detect_technologies(soup, html, dict(response.headers))
    desc, keywords, og = _extract_meta(soup)
    images = _extract_images(soup, url)
    lang = _detect_language(soup)
    word_count = len(text.split())

    record = ScrapedData(
        url=str(url),
        domain=domain,
        title=title,
        meta_description=desc,
        meta_keywords=keywords,
        og_data=og,
        raw_content=text[:50000],
        extracted_emails=emails,
        extracted_phones=phones,
        extracted_links=all_links[:200],
        internal_links=internal[:200],
        external_links=external[:200],
        social_media=social,
        technologies=techs,
        images=images,
        headers=dict(list(response.headers.items())[:20]),
        status_code=response.status_code,
        response_time=elapsed,
        word_count=word_count,
        language=lang,
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
