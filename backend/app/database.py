from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url.replace("postgresql://", "postgresql+psycopg://"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Add missing columns to existing tables without dropping data."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        # ── scraped_data migrations ───────────────────────────────────────
        if "scraped_data" in existing_tables:
            existing_cols = {c["name"] for c in inspector.get_columns("scraped_data")}
            migrations = {
                "domain": "VARCHAR(512)",
                "meta_description": "TEXT",
                "meta_keywords": "JSON DEFAULT '[]'",
                "og_data": "JSON DEFAULT '{}'",
                "internal_links": "JSON DEFAULT '[]'",
                "external_links": "JSON DEFAULT '[]'",
                "social_media": "JSON DEFAULT '{}'",
                "technologies": "JSON DEFAULT '[]'",
                "images": "JSON DEFAULT '[]'",
                "headers": "JSON DEFAULT '{}'",
                "status_code": "INTEGER",
                "response_time": "FLOAT",
                "word_count": "INTEGER DEFAULT 0",
                "language": "VARCHAR(10)",
                "is_deep_scrape": "BOOLEAN DEFAULT FALSE",
                "depth": "INTEGER DEFAULT 0",
                "parent_scrape_id": "INTEGER",
            }
            for col_name, col_type in migrations.items():
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE scraped_data ADD COLUMN {col_name} {col_type}"))

        # ── scraping_jobs table ───────────────────────────────────────────
        if "scraping_jobs" not in existing_tables:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS scraping_jobs (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    urls JSON DEFAULT '[]',
                    status VARCHAR(50) DEFAULT 'pending',
                    total_urls INTEGER DEFAULT 0,
                    completed_urls INTEGER DEFAULT 0,
                    failed_urls INTEGER DEFAULT 0,
                    results JSON DEFAULT '[]',
                    errors JSON DEFAULT '[]',
                    deep_scrape BOOLEAN DEFAULT FALSE,
                    max_depth INTEGER DEFAULT 1,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    completed_at TIMESTAMPTZ
                )
            """))
