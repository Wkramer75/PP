from pydantic import BaseModel
from datetime import datetime

VALID_STAGES = ["lead", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]


class ProspectCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    job_title: str | None = None
    website: str | None = None
    linkedin: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    stage: str = "lead"
    source: str | None = None
    tags: list[str] = []
    notes: str | None = None
    score: int = 0
    custom_fields: dict = {}
    scrape_id: int | None = None


class ProspectUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    job_title: str | None = None
    website: str | None = None
    linkedin: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    stage: str | None = None
    source: str | None = None
    tags: list[str] | None = None
    notes: str | None = None
    score: int | None = None
    custom_fields: dict | None = None


class ActivityCreate(BaseModel):
    type: str  # note, call, email, meeting, task
    description: str | None = None
    metadata_: dict = {}


class ActivityResponse(BaseModel):
    id: int
    prospect_id: int
    type: str
    description: str | None
    metadata_: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class ProspectResponse(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    email: str | None
    phone: str | None
    company: str | None
    job_title: str | None
    website: str | None
    linkedin: str | None
    address: str | None
    city: str | None
    country: str | None
    stage: str
    source: str | None
    tags: list[str]
    notes: str | None
    score: int
    custom_fields: dict
    scrape_id: int | None
    created_at: datetime
    updated_at: datetime
    activities: list[ActivityResponse] = []

    model_config = {"from_attributes": True}


class ProspectSummary(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    email: str | None
    company: str | None
    stage: str
    score: int
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PipelineStats(BaseModel):
    total_prospects: int
    by_stage: dict[str, int]
    by_source: dict[str, int]
    average_score: float
    recent_prospects: list[ProspectSummary]


class ImportFromScrapeRequest(BaseModel):
    scrape_id: int
    default_stage: str = "lead"
    default_source: str = "scraping"
    tags: list[str] = []
