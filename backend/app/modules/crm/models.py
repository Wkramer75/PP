from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Prospect(Base):
    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    email = Column(String(512), nullable=True, index=True)
    phone = Column(String(100), nullable=True)
    company = Column(String(512), nullable=True, index=True)
    job_title = Column(String(255), nullable=True)
    website = Column(String(2048), nullable=True)
    linkedin = Column(String(2048), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(255), nullable=True)
    country = Column(String(255), nullable=True)
    stage = Column(String(50), default="lead", index=True)  # lead, contacted, qualified, proposal, negotiation, won, lost
    source = Column(String(100), nullable=True)  # scraping, manual, import, referral
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    score = Column(Integer, default=0)  # lead scoring 0-100
    custom_fields = Column(JSON, default=dict)
    scrape_id = Column(Integer, nullable=True, index=True)  # link to scraping result
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    activities = relationship("Activity", back_populates="prospect", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # note, call, email, meeting, task, stage_change
    description = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    prospect = relationship("Prospect", back_populates="activities")
