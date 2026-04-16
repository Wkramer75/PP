from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.config import get_settings
from app.database import engine, Base, run_migrations

# Import module routers
from app.modules.scraping.routes import router as scraping_router
from app.modules.crm.routes import router as crm_router
from app.modules.email.routes import router as email_router
from app.modules.reporting.routes import router as reporting_router
from app.modules.ai.routes import router as ai_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="3.0.0",
    description="Sales prospecting platform — Scraping, CRM, Email, AI, Automation",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module routers
app.include_router(scraping_router, prefix="/api/scraping", tags=["scraping"])
app.include_router(crm_router, prefix="/api/crm", tags=["crm"])
app.include_router(email_router, prefix="/api/email", tags=["email"])
app.include_router(reporting_router, prefix="/api/reporting", tags=["reporting"])
app.include_router(ai_router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    run_migrations()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.app_name, "version": "3.0.0"}


# ── Async task endpoints (Celery) ────────────────────────────────────────────

class AsyncScrapeRequest(BaseModel):
    url: str
    depth: int = 0

class AsyncBatchRequest(BaseModel):
    urls: list[str]
    name: str | None = None
    deep: bool = False
    max_depth: int = 1


@app.post("/api/tasks/scrape", tags=["tasks"])
def submit_async_scrape(req: AsyncScrapeRequest):
    """Submit a scrape job to the Celery task queue."""
    try:
        from app.tasks import async_scrape_url
        task = async_scrape_url.delay(req.url, req.depth)
        return {"task_id": task.id, "status": "queued", "url": req.url}
    except Exception as e:
        return {"error": f"Celery non disponible: {str(e)}", "hint": "Lancez Redis + Celery worker"}


@app.post("/api/tasks/batch", tags=["tasks"])
def submit_async_batch(req: AsyncBatchRequest):
    """Submit a batch scrape job to the Celery task queue."""
    try:
        from app.tasks import async_batch_scrape
        task = async_batch_scrape.delay(req.urls, req.name, req.deep, req.max_depth)
        return {"task_id": task.id, "status": "queued", "total_urls": len(req.urls)}
    except Exception as e:
        return {"error": f"Celery non disponible: {str(e)}"}


@app.get("/api/tasks/{task_id}", tags=["tasks"])
def get_task_status(task_id: str):
    """Check the status of an async task."""
    try:
        from app.celery_app import celery
        result = celery.AsyncResult(task_id)
        response = {"task_id": task_id, "status": result.status}
        if result.ready():
            response["result"] = result.get(timeout=5)
        return response
    except Exception as e:
        return {"task_id": task_id, "error": str(e)}


# ── Prometheus metrics endpoint ──────────────────────────────────────────────

@app.get("/metrics", tags=["monitoring"])
def prometheus_metrics():
    """Basic Prometheus metrics endpoint."""
    from app.database import SessionLocal
    from app.modules.scraping.models import ScrapedData
    from app.modules.crm.models import Prospect

    db = SessionLocal()
    try:
        scrapes = db.query(ScrapedData).count()
        prospects = db.query(Prospect).count()
    finally:
        db.close()

    metrics = f"""# HELP prospecting_scrapes_total Total number of scrapes
# TYPE prospecting_scrapes_total gauge
prospecting_scrapes_total {scrapes}

# HELP prospecting_prospects_total Total number of prospects
# TYPE prospecting_prospects_total gauge
prospecting_prospects_total {prospects}

# HELP prospecting_app_info Application info
# TYPE prospecting_app_info gauge
prospecting_app_info{{version="3.0.0"}} 1
"""
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(metrics, media_type="text/plain; version=0.0.4")
