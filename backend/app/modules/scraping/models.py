from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class ScrapedData(Base):
    __tablename__ = "scraped_data"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(2048), nullable=False)
    title = Column(String(1024), nullable=True)
    raw_content = Column(Text, nullable=True)
    extracted_emails = Column(JSON, default=list)
    extracted_phones = Column(JSON, default=list)
    extracted_links = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
