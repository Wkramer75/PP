from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.reporting import service

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    """Get the full dashboard with all metrics."""
    try:
        return service.get_dashboard(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur dashboard: {str(e)[:300]}")
