import re
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.modules.scraping.models import ScrapedData

# Patterns for extraction
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(
    r"(?:\+?\d{1,3}[\s\-.]?)?"
    r"(?:\(?\d{1,4}\)?[\s\-.]?)?"
    r"\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def scrape_url(url: str, db: Session) -> ScrapedData:
    """Scrape a URL, extract data, and persist results."""
    response = requests.get(str(url), headers=HEADERS, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.title.string.strip() if soup.title and soup.title.string else None
    text = soup.get_text(separator=" ", strip=True)

    emails = sorted(set(EMAIL_PATTERN.findall(text)))

    raw_phones = PHONE_PATTERN.findall(text)
    phones = sorted(set(p.strip() for p in raw_phones if len(p.strip()) >= 7))

    links = []
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        if href.startswith(("http://", "https://")):
            links.append(href)
    links = sorted(set(links))

    record = ScrapedData(
        url=str(url),
        title=title,
        raw_content=text[:50000],  # limit stored content
        extracted_emails=emails,
        extracted_phones=phones,
        extracted_links=links,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_all_scrapes(db: Session, skip: int = 0, limit: int = 50) -> list[ScrapedData]:
    """Return recent scraping results."""
    return (
        db.query(ScrapedData)
        .order_by(ScrapedData.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_scrape_by_id(db: Session, scrape_id: int) -> ScrapedData | None:
    return db.query(ScrapedData).filter(ScrapedData.id == scrape_id).first()
