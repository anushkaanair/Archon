"""Redis client factory and caching helpers.

Provides a connection pool for the app lifespan and helper functions
for typed get/set operations with TTL support.
"""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis

from app.config import get_settings


async def create_redis_client() -> aioredis.Redis:
    """Create and return an async Redis client from application settings.

    Called once during the FastAPI lifespan startup.
    """
    settings = get_settings()
    return aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def cache_get(client: aioredis.Redis, key: str) -> Any | None:
    """Retrieve a JSON-serialised value from Redis.

    Returns ``None`` on cache miss.
    """
    raw = await client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_set(
    client: aioredis.Redis,
    key: str,
    value: Any,
    ttl_seconds: int = 3600,
) -> None:
    """Store a JSON-serialisable value in Redis with a TTL.

    Default TTL is 1 hour (3600 seconds) — matching the model registry
    cache requirement.
    """
    await client.set(key, json.dumps(value, default=str), ex=ttl_seconds)


async def cache_delete(client: aioredis.Redis, key: str) -> None:
    """Delete a cache entry by key."""
    await client.delete(key)
