"""FastAPI dependency injection.

Provides reusable dependencies for database sessions, Redis clients,
Qdrant connections, and API-key-based authentication.
"""

from __future__ import annotations

import hashlib
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.models.api_key import ApiKey
from app.db.models.user import User
from app.db.session import get_db


async def get_current_user(
    authorization: str = Header(..., description="Bearer <API key>"),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    """Authenticate a request via Bearer token and return the owning user.

    The raw API key is hashed with SHA-256 and looked up in the ``api_keys``
    table. If the key is missing, revoked, or the owning user is inactive,
    an HTTP 401 is raised.

    Security note: the raw key is never stored or logged — only the hash is
    compared.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header. Expected: Bearer <API key>",
        )

    raw_key = authorization[7:]  # strip "Bearer "

    # Hash the key the same way it was stored at creation time
    key_hash = hashlib.sha256(
        (raw_key + settings.api_key_hash_secret).encode()
    ).hexdigest()

    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.key_hash == key_hash, ApiKey.is_active.is_(True), ApiKey.deleted_at.is_(None))
    )
    api_key = result.scalar_one_or_none()

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key.",
        )

    # Load the owning user
    user_result = await db.execute(
        select(User).where(User.id == api_key.user_id, User.is_active.is_(True), User.deleted_at.is_(None))
    )
    user = user_result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or deleted.",
        )

    return user


def get_redis() -> Any:
    """Return the Redis client attached during app lifespan.

    This is a placeholder dependency; the actual Redis client is set on
    ``app.state.redis`` during startup and injected via the request state.
    In routes, prefer ``request.app.state.redis``.
    """
    return None  # Overridden at runtime


def get_qdrant() -> Any:
    """Return the Qdrant client attached during app lifespan.

    Like ``get_redis()``, the actual client is set on ``app.state.qdrant``
    during startup.
    """
    return None  # Overridden at runtime
