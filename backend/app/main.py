from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base

# Import module routers
from app.modules.scraping.routes import router as scraping_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Modular sales prospecting tool — V1: Scraping module",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module routers — add new modules here
app.include_router(scraping_router, prefix="/api/scraping", tags=["scraping"])
# app.include_router(email_router, prefix="/api/email", tags=["email"])
# app.include_router(crm_router, prefix="/api/crm", tags=["crm"])
# app.include_router(reporting_router, prefix="/api/reporting", tags=["reporting"])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}
