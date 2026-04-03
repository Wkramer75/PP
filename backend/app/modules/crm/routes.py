from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.modules.crm import schemas, service

router = APIRouter()


@router.post("/prospects", response_model=schemas.ProspectResponse)
def create_prospect(data: schemas.ProspectCreate, db: Session = Depends(get_db)):
    return service.create_prospect(db, data.model_dump())


@router.get("/prospects", response_model=list[schemas.ProspectSummary])
def list_prospects(
    skip: int = 0,
    limit: int = 50,
    stage: str | None = None,
    search: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
):
    return service.list_prospects(db, skip=skip, limit=limit, stage=stage, search=search, tag=tag)


@router.get("/prospects/export")
def export_csv(stage: str | None = None, db: Session = Depends(get_db)):
    csv_content = service.export_prospects_csv(db, stage)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prospects_export.csv"},
    )


@router.get("/pipeline", response_model=schemas.PipelineStats)
def pipeline_stats(db: Session = Depends(get_db)):
    return service.get_pipeline_stats(db)


@router.post("/import-scrape", response_model=list[schemas.ProspectResponse])
def import_from_scrape(data: schemas.ImportFromScrapeRequest, db: Session = Depends(get_db)):
    try:
        return service.import_from_scrape(
            db, data.scrape_id, data.default_stage, data.default_source, data.tags
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/prospects/{prospect_id}", response_model=schemas.ProspectResponse)
def get_prospect(prospect_id: int, db: Session = Depends(get_db)):
    prospect = service.get_prospect(db, prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect


@router.put("/prospects/{prospect_id}", response_model=schemas.ProspectResponse)
def update_prospect(prospect_id: int, data: schemas.ProspectUpdate, db: Session = Depends(get_db)):
    prospect = service.update_prospect(db, prospect_id, data.model_dump(exclude_unset=True))
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect


@router.delete("/prospects/{prospect_id}")
def delete_prospect(prospect_id: int, db: Session = Depends(get_db)):
    if not service.delete_prospect(db, prospect_id):
        raise HTTPException(status_code=404, detail="Prospect not found")
    return {"status": "deleted"}


@router.post("/prospects/{prospect_id}/activities", response_model=schemas.ActivityResponse)
def add_activity(prospect_id: int, data: schemas.ActivityCreate, db: Session = Depends(get_db)):
    try:
        return service.add_activity(db, prospect_id, data.type, data.description, data.metadata_)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/prospects/{prospect_id}/activities", response_model=list[schemas.ActivityResponse])
def get_activities(prospect_id: int, db: Session = Depends(get_db)):
    return service.get_activities(db, prospect_id)
