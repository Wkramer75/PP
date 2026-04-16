from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Float
from sqlalchemy.sql import func
from app.database import Base


class ScrapedData(Base):
    __tablename__ = "scraped_data"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(2048), nullable=False, index=True)
    domain = Column(String(512), nullable=True, index=True)
    title = Column(String(1024), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(JSON, default=list)
    og_data = Column(JSON, default=dict)
    raw_content = Column(Text, nullable=True)
    extracted_emails = Column(JSON, default=list)
    extracted_phones = Column(JSON, default=list)
    extracted_links = Column(JSON, default=list)
    internal_links = Column(JSON, default=list)
    external_links = Column(JSON, default=list)
    social_media = Column(JSON, default=dict)
    technologies = Column(JSON, default=list)
    images = Column(JSON, default=list)
    headers = Column(JSON, default=dict)
    status_code = Column(Integer, nullable=True)
    response_time = Column(Float, nullable=True)
    word_count = Column(Integer, default=0)
    language = Column(String(10), nullable=True)
    is_deep_scrape = Column(Boolean, default=False)
    depth = Column(Integer, default=0)
    parent_scrape_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    urls = Column(JSON, default=list)
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    total_urls = Column(Integer, default=0)
    completed_urls = Column(Integer, default=0)
    failed_urls = Column(Integer, default=0)
    results = Column(JSON, default=list)  # list of scraped_data IDs
    errors = Column(JSON, default=list)
    deep_scrape = Column(Boolean, default=False)
    max_depth = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
