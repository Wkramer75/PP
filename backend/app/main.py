from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base, run_migrations

# Import module routers
from app.modules.scraping.routes import router as scraping_router
from app.modules.crm.routes import router as crm_router
from app.modules.email.routes import router as email_router
from app.modules.reporting.routes import router as reporting_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description="Modular sales prospecting tool — Scraping, CRM, Email, Reporting",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module routers
app.include_router(scraping_router, prefix="/api/scraping", tags=["scraping"])
app.include_router(crm_router, prefix="/api/crm", tags=["crm"])
app.include_router(email_router, prefix="/api/email", tags=["email"])
app.include_router(reporting_router, prefix="/api/reporting", tags=["reporting"])


@app.on_event("startup")
def on_startup():
    # Create new tables
    Base.metadata.create_all(bind=engine)
    # Add missing columns to existing tables
    run_migrations()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.app_name, "version": "2.0.0"}
