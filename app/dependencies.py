"""FastAPI dependency injection.

Provides reusable dependencies for database sessions, Redis clients,
Qdrant connections, and authentication.

Authentication supports two token types (tried in order):
  1. JWT issued by /auth/{provider}/callback (OAuth flow)
  2. SHA-256-hashed API key stored in the api_keys table
"""

from __future__ import annotations

import hashlib
import uuid
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.models.api_key import ApiKey
from app.db.models.user import User
from app.db.session import get_db

JWT_ALGORITHM = "HS256"


async def get_current_user(
    authorization: str = Header(..., description="Bearer <JWT or API key>"),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    """Authenticate a request via Bearer token and return the owning user.

    Two token formats are accepted (tried in order):

    1. **JWT** — issued by the OAuth callback routes. Decoded with the
       ``JWT_SECRET`` and the ``sub`` claim used to look up the user.

    2. **API key** — a raw key that has been SHA-256-hashed (with the
       ``API_KEY_HASH_SECRET`` salt) and stored in the ``api_keys`` table.

    If neither authentication method succeeds an HTTP 401 is raised.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header. Expected: Bearer <token>",
        )

    raw_token = authorization[7:]  # strip "Bearer "

    # ── 1. Try JWT decode ────────────────────────────────────────────────────
    try:
        payload = jwt.decode(raw_token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str:
            try:
                uid = uuid.UUID(user_id_str)
            except ValueError:
                uid = None

            if uid:
                result = await db.execute(
                    select(User).where(
                        User.id == uid,
                        User.is_active.is_(True),
                        User.deleted_at.is_(None),
                    )
                )
                user = result.scalar_one_or_none()
                if user:
                    return user
    except JWTError:
        pass  # Not a valid JWT — try API key next
    except Exception:
        pass

    # ── 2. Try API key hash lookup ───────────────────────────────────────────
    key_hash = hashlib.sha256(
        (raw_token + settings.api_key_hash_secret).encode()
    ).hexdigest()

    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_active.is_(True),
            ApiKey.deleted_at.is_(None),
        )
    )
    api_key = result.scalar_one_or_none()

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked credentials.",
        )

    user_result = await db.execute(
        select(User).where(
            User.id == api_key.user_id,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
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

    The actual client is set on ``app.state.redis`` during startup.
    In routes, prefer ``request.app.state.redis``.
    """
    return None


def get_qdrant() -> Any:
    """Return the Qdrant client attached during app lifespan.

    The actual client is set on ``app.state.qdrant`` during startup.
    """
    return None
