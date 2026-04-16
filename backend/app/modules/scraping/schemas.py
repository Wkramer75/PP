from pydantic import BaseModel, HttpUrl
from datetime import datetime


class ScrapeRequest(BaseModel):
    url: HttpUrl


class BatchScrapeRequest(BaseModel):
    urls: list[str]
    name: str | None = None
    deep_scrape: bool = False
    max_depth: int = 1


class ScrapeResult(BaseModel):
    id: int
    url: str
    domain: str | None
    title: str | None
    meta_description: str | None
    meta_keywords: list[str]
    og_data: dict
    extracted_emails: list[str]
    extracted_phones: list[str]
    extracted_links: list[str]
    internal_links: list[str]
    external_links: list[str]
    social_media: dict
    technologies: list[str]
    images: list[str]
    status_code: int | None
    response_time: float | None
    word_count: int
    language: str | None
    is_deep_scrape: bool
    depth: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ScrapeResultSummary(BaseModel):
    id: int
    url: str
    domain: str | None
    title: str | None
    emails_count: int
    phones_count: int
    links_count: int
    technologies: list[str]
    status_code: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScrapingJobResponse(BaseModel):
    id: int
    name: str | None
    urls: list[str]
    status: str
    total_urls: int
    completed_urls: int
    failed_urls: int
    results: list[int]
    errors: list[dict]
    deep_scrape: bool
    max_depth: int
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ScrapingStats(BaseModel):
    total_scrapes: int
    total_emails: int
    total_phones: int
    total_links: int
    unique_domains: int
    top_technologies: list[dict]
    recent_scrapes: list[ScrapeResultSummary]
