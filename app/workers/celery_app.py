"""Celery application configuration.

Uses Redis as both broker and result backend. Configured with:
- Exponential backoff retry (max 3 retries) per project rules
- Dead letter queue for failed tasks
- Task serialisation via JSON
"""

from __future__ import annotations

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "archon",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    # Serialisation
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Retry policy: exponential backoff, max 3 retries
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=5,
    task_max_retries=3,

    # Dead letter queue
    task_routes={
        "app.workers.tasks.*": {"queue": "archon_default"},
    },
    task_default_queue="archon_default",

    # Timeouts
    task_soft_time_limit=120,  # 2 minutes
    task_time_limit=180,       # 3 minutes hard limit

    # Result expiry
    result_expires=3600,  # 1 hour

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)
