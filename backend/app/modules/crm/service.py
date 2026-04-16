import csv
import io
from collections import Counter

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.modules.crm.models import Prospect, Activity
from app.modules.scraping.models import ScrapedData


def create_prospect(db: Session, data: dict) -> Prospect:
    prospect = Prospect(**data)
    db.add(prospect)
    db.commit()
    db.refresh(prospect)
    _log_activity(db, prospect.id, "note", "Prospect created")
    return prospect


def update_prospect(db: Session, prospect_id: int, data: dict) -> Prospect | None:
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        return None

    old_stage = prospect.stage
    for key, value in data.items():
        if value is not None:
            setattr(prospect, key, value)

    if "stage" in data and data["stage"] and data["stage"] != old_stage:
        _log_activity(db, prospect.id, "stage_change",
                      f"Stage changed: {old_stage} → {data['stage']}")

    db.commit()
    db.refresh(prospect)
    return prospect


def delete_prospect(db: Session, prospect_id: int) -> bool:
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        return False
    db.delete(prospect)
    db.commit()
    return True


def get_prospect(db: Session, prospect_id: int) -> Prospect | None:
    return db.query(Prospect).filter(Prospect.id == prospect_id).first()


def list_prospects(db: Session, skip: int = 0, limit: int = 50,
                   stage: str | None = None, search: str | None = None,
                   tag: str | None = None) -> list[Prospect]:
    query = db.query(Prospect)

    if stage:
        query = query.filter(Prospect.stage == stage)
    if search:
        query = query.filter(
            (Prospect.first_name.ilike(f"%{search}%"))
            | (Prospect.last_name.ilike(f"%{search}%"))
            | (Prospect.email.ilike(f"%{search}%"))
            | (Prospect.company.ilike(f"%{search}%"))
        )
    if tag:
        query = query.filter(Prospect.tags.contains([tag]))

    return query.order_by(Prospect.created_at.desc()).offset(skip).limit(limit).all()


def _log_activity(db: Session, prospect_id: int, type_: str, description: str,
                  metadata: dict | None = None):
    activity = Activity(
        prospect_id=prospect_id,
        type=type_,
        description=description,
        metadata_=metadata or {},
    )
    db.add(activity)
    db.commit()


def add_activity(db: Session, prospect_id: int, type_: str,
                 description: str | None, metadata: dict) -> Activity:
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError("Prospect not found")
    activity = Activity(
        prospect_id=prospect_id,
        type=type_,
        description=description,
        metadata_=metadata,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def get_activities(db: Session, prospect_id: int) -> list[Activity]:
    return (
        db.query(Activity)
        .filter(Activity.prospect_id == prospect_id)
        .order_by(Activity.created_at.desc())
        .all()
    )


def get_pipeline_stats(db: Session) -> dict:
    total = db.query(Prospect).count()
    prospects = db.query(Prospect).all()

    stage_counts = Counter()
    source_counts = Counter()
    total_score = 0

    for p in prospects:
        stage_counts[p.stage] += 1
        if p.source:
            source_counts[p.source] += 1
        total_score += p.score

    recent = (
        db.query(Prospect)
        .order_by(Prospect.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_prospects": total,
        "by_stage": dict(stage_counts),
        "by_source": dict(source_counts),
        "average_score": round(total_score / total, 1) if total > 0 else 0,
        "recent_prospects": recent,
    }


def import_from_scrape(db: Session, scrape_id: int, default_stage: str = "lead",
                       default_source: str = "scraping", tags: list[str] = []) -> list[Prospect]:
    """Import prospects from a scraping result (one prospect per email found)."""
    scrape = db.query(ScrapedData).filter(ScrapedData.id == scrape_id).first()
    if not scrape:
        raise ValueError("Scrape not found")

    created = []
    emails = scrape.extracted_emails or []

    if not emails:
        # Create one prospect with just the domain/company info
        prospect = Prospect(
            company=scrape.domain,
            website=scrape.url,
            stage=default_stage,
            source=default_source,
            tags=tags,
            scrape_id=scrape_id,
            phone=(scrape.extracted_phones or [None])[0] if scrape.extracted_phones else None,
        )
        db.add(prospect)
        db.commit()
        db.refresh(prospect)
        _log_activity(db, prospect.id, "note", f"Imported from scraping: {scrape.url}")
        created.append(prospect)
    else:
        for email in emails:
            existing = db.query(Prospect).filter(Prospect.email == email).first()
            if existing:
                continue
            prospect = Prospect(
                email=email,
                company=scrape.domain,
                website=scrape.url,
                stage=default_stage,
                source=default_source,
                tags=tags,
                scrape_id=scrape_id,
            )
            db.add(prospect)
            db.commit()
            db.refresh(prospect)
            _log_activity(db, prospect.id, "note", f"Imported from scraping: {scrape.url}")
            created.append(prospect)

    return created


def export_prospects_csv(db: Session, stage: str | None = None) -> str:
    query = db.query(Prospect)
    if stage:
        query = query.filter(Prospect.stage == stage)
    prospects = query.order_by(Prospect.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "First Name", "Last Name", "Email", "Phone", "Company",
        "Job Title", "Website", "Stage", "Source", "Score", "Tags", "City", "Country", "Date"
    ])
    for p in prospects:
        writer.writerow([
            p.id, p.first_name, p.last_name, p.email, p.phone, p.company,
            p.job_title, p.website, p.stage, p.source, p.score,
            "; ".join(p.tags or []), p.city, p.country,
            p.created_at.isoformat() if p.created_at else "",
        ])
    return output.getvalue()
