"""Async SQLAlchemy session factory.

Provides a single ``async_session_factory`` and a FastAPI-compatible
dependency ``get_db()`` that yields a session per request and guarantees
cleanup on completion.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

_settings = get_settings()

def _make_engine():
    url = _settings.database_url
    # Render provides postgresql:// but asyncpg requires postgresql+asyncpg://
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite"):
        # SQLite uses StaticPool — no pool_size / max_overflow
        from sqlalchemy.pool import StaticPool
        return create_async_engine(
            url,
            echo=_settings.debug,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_async_engine(
        url,
        echo=_settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

engine = _make_engine()

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async SQLAlchemy session.

    The session is committed on success and rolled back on exception,
    then closed unconditionally.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
