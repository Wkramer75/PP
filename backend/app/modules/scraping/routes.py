from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.modules.scraping import schemas, service

router = APIRouter()


@router.post("/", response_model=schemas.ScrapeResult)
def launch_scrape(payload: schemas.ScrapeRequest, db: Session = Depends(get_db)):
    """Scrape a single URL with full extraction."""
    try:
        result = service.scrape_url(str(payload.url), db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur inattendue: {str(e)[:200]}")


@router.post("/batch", response_model=schemas.ScrapingJobResponse)
def launch_batch_scrape(payload: schemas.BatchScrapeRequest, db: Session = Depends(get_db)):
    """Scrape multiple URLs in batch."""
    if len(payload.urls) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 URLs par batch")
    try:
        job = service.batch_scrape(
            payload.urls, db, name=payload.name,
            deep=payload.deep_scrape, max_depth=payload.max_depth,
        )
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur batch: {str(e)[:200]}")


@router.post("/deep", response_model=list[schemas.ScrapeResult])
def launch_deep_scrape(
    payload: schemas.ScrapeRequest,
    max_depth: int = Query(default=1, ge=1, le=3),
    db: Session = Depends(get_db),
):
    """Deep scrape: follow internal links."""
    try:
        results = service.deep_scrape(str(payload.url), db, max_depth)
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur deep scrape: {str(e)[:200]}")


@router.get("/", response_model=list[schemas.ScrapeResult])
def list_scrapes(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return service.get_all_scrapes(db, skip=skip, limit=limit)


@router.get("/stats", response_model=schemas.ScrapingStats)
def get_stats(db: Session = Depends(get_db)):
    return service.get_scraping_stats(db)


@router.get("/search", response_model=list[schemas.ScrapeResult])
def search(q: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return service.search_scrapes(db, q, skip=skip, limit=limit)


@router.get("/export")
def export_csv(ids: str = Query(default=""), db: Session = Depends(get_db)):
    scrape_ids = [int(i) for i in ids.split(",") if i.strip()] if ids else None
    csv_content = service.export_scrapes_csv(db, scrape_ids)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=scraping_export.csv"},
    )


@router.get("/jobs", response_model=list[schemas.ScrapingJobResponse])
def list_jobs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return service.get_all_jobs(db, skip=skip, limit=limit)


@router.get("/{scrape_id}", response_model=schemas.ScrapeResult)
def get_scrape(scrape_id: int, db: Session = Depends(get_db)):
    result = service.get_scrape_by_id(db, scrape_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scrape introuvable")
    return result


@router.delete("/{scrape_id}")
def delete_scrape(scrape_id: int, db: Session = Depends(get_db)):
    if not service.delete_scrape(db, scrape_id):
        raise HTTPException(status_code=404, detail="Scrape introuvable")
    return {"status": "deleted"}
