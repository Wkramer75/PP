from pydantic import BaseModel
from datetime import datetime


# ── Templates ─────────────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str
    subject: str
    body_html: str
    body_text: str | None = None
    variables: list[str] = []
    category: str | None = None


class TemplateUpdate(BaseModel):
    name: str | None = None
    subject: str | None = None
    body_html: str | None = None
    body_text: str | None = None
    variables: list[str] | None = None
    category: str | None = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    subject: str
    body_html: str
    body_text: str | None
    variables: list[str]
    category: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Campaigns ─────────────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    name: str
    template_id: int
    subject_override: str | None = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    from_name: str | None = None
    from_email: str | None = None


class CampaignResponse(BaseModel):
    id: int
    name: str
    template_id: int
    status: str
    subject_override: str | None
    total_recipients: int
    sent_count: int
    failed_count: int
    smtp_host: str
    smtp_port: int
    from_name: str | None
    from_email: str | None
    created_at: datetime
    sent_at: datetime | None

    model_config = {"from_attributes": True}


class AddRecipientsRequest(BaseModel):
    prospect_ids: list[int] = []
    emails: list[str] = []


class RecipientResponse(BaseModel):
    id: int
    campaign_id: int
    prospect_id: int | None
    email: str
    name: str | None
    status: str
    error_message: str | None
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SendTestRequest(BaseModel):
    template_id: int
    to_email: str
    variables: dict = {}
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    from_name: str | None = None
    from_email: str | None = None


class EmailStats(BaseModel):
    total_templates: int
    total_campaigns: int
    total_sent: int
    total_failed: int
    campaigns_by_status: dict[str, int]
