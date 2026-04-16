import os
from celery import Celery
from celery.schedules import crontab

broker = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

celery = Celery("prospecting", broker=broker, backend=result_backend)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Paris",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Scheduled tasks
celery.conf.beat_schedule = {
    "enrich-leads-daily": {
        "task": "app.tasks.enrich_all_prospects",
        "schedule": crontab(hour=2, minute=0),  # 2h du matin
    },
    "cleanup-old-scrapes": {
        "task": "app.tasks.cleanup_old_scrapes",
        "schedule": crontab(hour=3, minute=0, day_of_week=0),  # dimanche 3h
    },
}

celery.autodiscover_tasks(["app"])
