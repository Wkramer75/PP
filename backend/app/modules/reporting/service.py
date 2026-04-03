from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.modules.scraping.models import ScrapedData, ScrapingJob
from app.modules.crm.models import Prospect, Activity
from app.modules.email.models import EmailTemplate, EmailCampaign, EmailRecipient


def get_dashboard(db: Session) -> dict:
    """Global dashboard with all key metrics."""
    now = datetime.now(timezone.utc)
    last_7_days = now - timedelta(days=7)
    last_30_days = now - timedelta(days=30)

    # ── Scraping stats ────────────────────────────────────────────────────
    total_scrapes = db.query(ScrapedData).count()
    scrapes_7d = db.query(ScrapedData).filter(ScrapedData.created_at >= last_7_days).count()

    all_scrapes = db.query(ScrapedData).all()
    total_emails_found = sum(len(s.extracted_emails or []) for s in all_scrapes)
    total_phones_found = sum(len(s.extracted_phones or []) for s in all_scrapes)
    unique_domains = len(set(s.domain for s in all_scrapes if s.domain))

    tech_counter = Counter()
    for s in all_scrapes:
        for t in (s.technologies or []):
            tech_counter[t] += 1

    # ── CRM stats ─────────────────────────────────────────────────────────
    total_prospects = db.query(Prospect).count()
    prospects_7d = db.query(Prospect).filter(Prospect.created_at >= last_7_days).count()
    prospects = db.query(Prospect).all()

    stage_counts = Counter(p.stage for p in prospects)
    source_counts = Counter(p.source for p in prospects if p.source)
    avg_score = round(sum(p.score for p in prospects) / total_prospects, 1) if total_prospects else 0

    won_count = stage_counts.get("won", 0)
    lost_count = stage_counts.get("lost", 0)
    conversion_rate = round(won_count / (won_count + lost_count) * 100, 1) if (won_count + lost_count) > 0 else 0

    # ── Email stats ───────────────────────────────────────────────────────
    total_campaigns = db.query(EmailCampaign).count()
    campaigns = db.query(EmailCampaign).all()
    total_sent = sum(c.sent_count for c in campaigns)
    total_failed = sum(c.failed_count for c in campaigns)

    # ── Activity timeline (last 30 days) ──────────────────────────────────
    recent_activities = (
        db.query(Activity)
        .filter(Activity.created_at >= last_30_days)
        .order_by(Activity.created_at.desc())
        .limit(20)
        .all()
    )

    activity_timeline = []
    for a in recent_activities:
        prospect = db.query(Prospect).filter(Prospect.id == a.prospect_id).first()
        activity_timeline.append({
            "id": a.id,
            "type": a.type,
            "description": a.description,
            "prospect_name": f"{prospect.first_name or ''} {prospect.last_name or ''}".strip() if prospect else "Unknown",
            "prospect_id": a.prospect_id,
            "date": a.created_at.isoformat() if a.created_at else "",
        })

    # ── Scraping timeline (scrapes per day, last 30 days) ─────────────────
    scraping_timeline = []
    for i in range(30):
        day = now - timedelta(days=29 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(ScrapedData).filter(
            ScrapedData.created_at >= day_start,
            ScrapedData.created_at < day_end,
        ).count()
        scraping_timeline.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count,
        })

    return {
        "scraping": {
            "total": total_scrapes,
            "last_7_days": scrapes_7d,
            "total_emails_found": total_emails_found,
            "total_phones_found": total_phones_found,
            "unique_domains": unique_domains,
            "top_technologies": [{"name": k, "count": v} for k, v in tech_counter.most_common(10)],
            "timeline": scraping_timeline,
        },
        "crm": {
            "total_prospects": total_prospects,
            "new_last_7_days": prospects_7d,
            "by_stage": dict(stage_counts),
            "by_source": dict(source_counts),
            "average_score": avg_score,
            "conversion_rate": conversion_rate,
        },
        "email": {
            "total_campaigns": total_campaigns,
            "total_sent": total_sent,
            "total_failed": total_failed,
            "delivery_rate": round((total_sent / (total_sent + total_failed)) * 100, 1) if (total_sent + total_failed) > 0 else 0,
        },
        "activity_timeline": activity_timeline,
    }
