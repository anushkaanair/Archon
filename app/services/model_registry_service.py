"""Model registry service.

Manages the AI model registry with Redis caching (TTL 1hr). Provides
functions to list models, filter by capability, and fetch live pricing.

Pricing is NEVER hardcoded — it's read from the database/config and
the ``pricing_source`` URL is always tracked.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.redis_client import cache_get, cache_set
from app.config import get_settings
from app.db.models.model_registry import ModelRegistryEntry

CACHE_KEY = "archon:model_registry:all"


async def get_all_models(
    db: AsyncSession,
    redis_client: Any | None = None,
) -> list[dict]:
    """Return all active models, using Redis cache if available.

    Cache TTL is controlled by ``model_registry_cache_ttl`` setting
    (default 1 hour).

    Args:
        db: Async SQLAlchemy session.
        redis_client: Optional async Redis client for caching.

    Returns:
        List of model dicts with all fields serialised.
    """
    settings = get_settings()

    # Try cache first
    if redis_client:
        cached = await cache_get(redis_client, CACHE_KEY)
        if cached is not None:
            return cached

    # Cache miss — query the database
    result = await db.execute(
        select(ModelRegistryEntry).where(
            ModelRegistryEntry.is_active.is_(True),
            ModelRegistryEntry.deleted_at.is_(None),
        )
    )
    models = result.scalars().all()

    model_dicts = [
        {
            "id": str(m.id),
            "provider": m.provider,
            "model_name": m.model_name,
            "model_version": m.model_version,
            "capabilities": m.capabilities,
            "pricing": m.pricing,
            "pricing_source": m.pricing_source,
            "pricing_fetched_at": m.pricing_fetched_at.isoformat() if m.pricing_fetched_at else None,
            "latency_p50_ms": m.latency_p50_ms,
            "latency_p95_ms": m.latency_p95_ms,
            "latency_source": m.latency_source,
            "quality_scores": m.quality_scores,
            "quality_source": m.quality_source,
            "is_active": m.is_active,
        }
        for m in models
    ]

    # Populate cache
    if redis_client:
        await cache_set(redis_client, CACHE_KEY, model_dicts, ttl_seconds=settings.model_registry_cache_ttl)

    return model_dicts


async def get_models_for_task(
    task: str,
    db: AsyncSession,
    redis_client: Any | None = None,
) -> list[dict]:
    """Filter models by capability matching a specific AI task.

    Args:
        task: Task slug (e.g. 'rag', 'code_generation').
        db: Async SQLAlchemy session.
        redis_client: Optional Redis client.

    Returns:
        List of model dicts whose capabilities include the given task.
    """
    all_models = await get_all_models(db, redis_client)
    return [m for m in all_models if task in m.get("capabilities", [])]


async def invalidate_cache(redis_client: Any) -> None:
    """Invalidate the model registry cache.

    Call this after updating model data in the database to ensure
    the next request fetches fresh data.
    """
    from app.cache.redis_client import cache_delete
    await cache_delete(redis_client, CACHE_KEY)
