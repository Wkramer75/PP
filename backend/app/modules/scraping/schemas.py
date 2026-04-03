from pydantic import BaseModel, HttpUrl
from datetime import datetime


class ScrapeRequest(BaseModel):
    url: HttpUrl


class ScrapeResult(BaseModel):
    id: int
    url: str
    title: str | None
    extracted_emails: list[str]
    extracted_phones: list[str]
    extracted_links: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
