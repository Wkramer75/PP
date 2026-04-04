"""
Celery async tasks for scraping, enrichment, and automation.
"""
import os
from datetime import datetime, timedelta, timezone

from app.celery_app import celery
from app.database import SessionLocal
from app.modules.scraping.service import scrape_url, batch_scrape, deep_scrape
from app.modules.crm.models import Prospect
from app.modules.scraping.models import ScrapedData


# ── Async scraping tasks ─────────────────────────────────────────────────────

@celery.task(bind=True, name="app.tasks.async_scrape_url")
def async_scrape_url(self, url: str, depth: int = 0):
    """Scrape a single URL asynchronously."""
    db = SessionLocal()
    try:
        result = scrape_url(url, db, depth=depth)
        return {"id": result.id, "url": result.url, "title": result.title, "emails": len(result.extracted_emails or [])}
    except Exception as e:
        self.retry(exc=e, countdown=30, max_retries=2)
    finally:
        db.close()


@celery.task(bind=True, name="app.tasks.async_batch_scrape")
def async_batch_scrape(self, urls: list[str], name: str = None, deep: bool = False, max_depth: int = 1):
    """Batch scrape multiple URLs asynchronously."""
    db = SessionLocal()
    try:
        job = batch_scrape(urls, db, name=name, deep=deep, max_depth=max_depth)
        return {"job_id": job.id, "completed": job.completed_urls, "failed": job.failed_urls, "total": job.total_urls}
    finally:
        db.close()


@celery.task(bind=True, name="app.tasks.async_deep_scrape")
def async_deep_scrape(self, url: str, max_depth: int = 1):
    """Deep scrape a URL following internal links asynchronously."""
    db = SessionLocal()
    try:
        results = deep_scrape(url, db, max_depth=max_depth)
        return {"url": url, "pages_scraped": len(results)}
    finally:
        db.close()


# ── Enrichment tasks ─────────────────────────────────────────────────────────

@celery.task(name="app.tasks.enrich_prospect")
def enrich_prospect(prospect_id: int):
    """Enrich a single prospect by scraping their website."""
    db = SessionLocal()
    try:
        prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
        if not prospect or not prospect.website:
            return {"status": "skipped", "reason": "no website"}

        result = scrape_url(prospect.website, db)

        # Auto-update prospect with scraped data
        if result.extracted_emails and not prospect.email:
            prospect.email = result.extracted_emails[0]
        if result.extracted_phones and not prospect.phone:
            prospect.phone = result.extracted_phones[0]
        if result.social_media:
            if "linkedin" in result.social_media and not prospect.linkedin:
                prospect.linkedin = result.social_media["linkedin"]

        db.commit()
        return {"status": "enriched", "prospect_id": prospect_id, "emails_found": len(result.extracted_emails or [])}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery.task(name="app.tasks.enrich_all_prospects")
def enrich_all_prospects():
    """Daily task: enrich all prospects that have a website but missing data."""
    db = SessionLocal()
    try:
        prospects = db.query(Prospect).filter(
            Prospect.website.isnot(None),
            Prospect.website != "",
        ).all()

        enriched = 0
        for p in prospects:
            if not p.email or not p.phone:
                try:
                    enrich_prospect.delay(p.id)
                    enriched += 1
                except Exception:
                    pass

        return {"total_prospects": len(prospects), "enrichment_queued": enriched}
    finally:
        db.close()


# ── Cleanup tasks ────────────────────────────────────────────────────────────

@celery.task(name="app.tasks.cleanup_old_scrapes")
def cleanup_old_scrapes(days: int = 90):
    """Weekly task: remove scrape results older than X days."""
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        deleted = db.query(ScrapedData).filter(ScrapedData.created_at < cutoff).delete()
        db.commit()
        return {"deleted": deleted, "cutoff_days": days}
    finally:
        db.close()


# ── Integration tasks ────────────────────────────────────────────────────────

@celery.task(name="app.tasks.push_to_espocrm")
def push_to_espocrm(prospect_id: int):
    """Push a prospect to EspoCRM via API."""
    import requests

    espo_url = os.getenv("ESPOCRM_URL", "http://espocrm:80")
    espo_key = os.getenv("ESPOCRM_API_KEY", "")

    db = SessionLocal()
    try:
        prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
        if not prospect:
            return {"status": "not_found"}

        headers = {"X-Api-Key": espo_key, "Content-Type": "application/json"}
        payload = {
            "firstName": prospect.first_name or "",
            "lastName": prospect.last_name or "",
            "emailAddress": prospect.email or "",
            "phoneNumber": prospect.phone or "",
            "website": prospect.website or "",
            "accountName": prospect.company or "",
            "title": prospect.job_title or "",
            "addressCity": prospect.city or "",
            "addressCountry": prospect.country or "",
            "description": prospect.notes or "",
        }

        resp = requests.post(f"{espo_url}/api/v1/Lead", json=payload, headers=headers, timeout=15)
        return {"status": "pushed", "espo_status": resp.status_code}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery.task(name="app.tasks.push_to_mautic")
def push_to_mautic(prospect_id: int):
    """Push a prospect to Mautic as a contact."""
    import requests

    mautic_url = os.getenv("MAUTIC_URL", "http://mautic:80")
    mautic_user = os.getenv("MAUTIC_API_USER", "admin")
    mautic_pass = os.getenv("MAUTIC_API_PASSWORD", "admin123")

    db = SessionLocal()
    try:
        prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
        if not prospect:
            return {"status": "not_found"}

        payload = {
            "firstname": prospect.first_name or "",
            "lastname": prospect.last_name or "",
            "email": prospect.email or "",
            "phone": prospect.phone or "",
            "company": prospect.company or "",
            "city": prospect.city or "",
            "country": prospect.country or "",
            "website": prospect.website or "",
        }

        resp = requests.post(
            f"{mautic_url}/api/contacts/new",
            json=payload,
            auth=(mautic_user, mautic_pass),
            timeout=15,
        )
        return {"status": "pushed", "mautic_status": resp.status_code}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
