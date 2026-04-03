from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.scraping import schemas, service

router = APIRouter()


@router.post("/", response_model=schemas.ScrapeResult)
def launch_scrape(payload: schemas.ScrapeRequest, db: Session = Depends(get_db)):
    """Launch a scraping job on the given URL."""
    try:
        result = service.scrape_url(str(payload.url), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scraping failed: {e}")


@router.get("/", response_model=list[schemas.ScrapeResult])
def list_scrapes(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all previous scraping results."""
    return service.get_all_scrapes(db, skip=skip, limit=limit)


@router.get("/{scrape_id}", response_model=schemas.ScrapeResult)
def get_scrape(scrape_id: int, db: Session = Depends(get_db)):
    """Get a specific scraping result by ID."""
    result = service.get_scrape_by_id(db, scrape_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scrape not found")
    return result
