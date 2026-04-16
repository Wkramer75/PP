from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.modules.ai import service
from app.modules.crm.models import Prospect

router = APIRouter(prefix="/api/ai", tags=["AI"])


class EmailRequest(BaseModel):
    prospect_id: int | None = None
    first_name: str = ""
    company: str = ""
    job_title: str = ""
    email_type: str = "intro"
    sender_name: str = "Votre nom"
    custom_context: str = ""


class ScoreRequest(BaseModel):
    prospect_id: int


@router.post("/generate-email")
def generate_email(req: EmailRequest, db: Session = Depends(get_db)):
    """Generate a personalized email using AI or templates."""
    if req.prospect_id:
        prospect = db.query(Prospect).filter(Prospect.id == req.prospect_id).first()
        if prospect:
            data = {
                "first_name": prospect.first_name or req.first_name,
                "last_name": prospect.last_name or "",
                "company": prospect.company or req.company,
                "job_title": prospect.job_title or req.job_title,
                "email": prospect.email or "",
            }
        else:
            data = {"first_name": req.first_name, "company": req.company, "job_title": req.job_title}
    else:
        data = {"first_name": req.first_name, "company": req.company, "job_title": req.job_title}

    return service.generate_email(data, req.email_type, req.sender_name, req.custom_context)


@router.post("/score")
def score_prospect(req: ScoreRequest, db: Session = Depends(get_db)):
    """Calculate AI-based lead score for a prospect."""
    prospect = db.query(Prospect).filter(Prospect.id == req.prospect_id).first()
    if not prospect:
        return {"error": "Prospect non trouve"}

    data = {
        "email": prospect.email, "phone": prospect.phone,
        "company": prospect.company, "job_title": prospect.job_title,
        "linkedin": prospect.linkedin, "website": prospect.website,
        "city": prospect.city,
    }
    return service.score_prospect(data)


@router.post("/classify")
def classify_prospect(req: ScoreRequest, db: Session = Depends(get_db)):
    """Classify a prospect (hot/warm/cold) with recommendations."""
    prospect = db.query(Prospect).filter(Prospect.id == req.prospect_id).first()
    if not prospect:
        return {"error": "Prospect non trouve"}

    data = {
        "email": prospect.email, "phone": prospect.phone,
        "company": prospect.company, "job_title": prospect.job_title,
        "linkedin": prospect.linkedin, "website": prospect.website,
        "city": prospect.city,
    }
    return service.classify_prospect(data)


@router.post("/auto-score")
def auto_score_all(db: Session = Depends(get_db)):
    """Auto-score all prospects based on their available data."""
    return service.auto_score_all(db)


@router.get("/status")
def ai_status():
    """Check if AI (Ollama) is available."""
    available = service._ollama_available()
    return {
        "ollama_available": available,
        "model": service.OLLAMA_MODEL if available else None,
        "fallback": "template-based generation",
    }
