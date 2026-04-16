from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.email import schemas, service

router = APIRouter()


# ── Templates ─────────────────────────────────────────────────────────────────

@router.post("/templates", response_model=schemas.TemplateResponse)
def create_template(data: schemas.TemplateCreate, db: Session = Depends(get_db)):
    return service.create_template(db, data.model_dump())


@router.get("/templates", response_model=list[schemas.TemplateResponse])
def list_templates(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return service.list_templates(db, skip=skip, limit=limit)


@router.get("/templates/{template_id}", response_model=schemas.TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = service.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/templates/{template_id}", response_model=schemas.TemplateResponse)
def update_template(template_id: int, data: schemas.TemplateUpdate, db: Session = Depends(get_db)):
    template = service.update_template(db, template_id, data.model_dump(exclude_unset=True))
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    if not service.delete_template(db, template_id):
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "deleted"}


# ── Campaigns ─────────────────────────────────────────────────────────────────

@router.post("/campaigns", response_model=schemas.CampaignResponse)
def create_campaign(data: schemas.CampaignCreate, db: Session = Depends(get_db)):
    return service.create_campaign(db, data.model_dump())


@router.get("/campaigns", response_model=list[schemas.CampaignResponse])
def list_campaigns(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return service.list_campaigns(db, skip=skip, limit=limit)


@router.get("/campaigns/{campaign_id}", response_model=schemas.CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    if not service.delete_campaign(db, campaign_id):
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"status": "deleted"}


@router.post("/campaigns/{campaign_id}/recipients", response_model=list[schemas.RecipientResponse])
def add_recipients(campaign_id: int, data: schemas.AddRecipientsRequest, db: Session = Depends(get_db)):
    try:
        created = []
        if data.prospect_ids:
            created.extend(service.add_recipients_from_prospects(db, campaign_id, data.prospect_ids))
        if data.emails:
            created.extend(service.add_recipients_from_emails(db, campaign_id, data.emails))
        return created
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/campaigns/{campaign_id}/recipients", response_model=list[schemas.RecipientResponse])
def get_recipients(campaign_id: int, db: Session = Depends(get_db)):
    return service.get_recipients(db, campaign_id)


@router.post("/campaigns/{campaign_id}/send", response_model=schemas.CampaignResponse)
def send_campaign(campaign_id: int, db: Session = Depends(get_db)):
    try:
        return service.send_campaign(db, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Test & Stats ──────────────────────────────────────────────────────────────

@router.post("/send-test")
def send_test(data: schemas.SendTestRequest, db: Session = Depends(get_db)):
    try:
        service.send_test_email(
            db, data.template_id, data.to_email, data.variables,
            data.smtp_host, data.smtp_port, data.smtp_user, data.smtp_password,
            data.from_name, data.from_email,
        )
        return {"status": "sent"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to send: {e}")


@router.get("/stats", response_model=schemas.EmailStats)
def email_stats(db: Session = Depends(get_db)):
    return service.get_email_stats(db)
