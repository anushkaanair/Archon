"""FastAPI application factory.

Creates the Archon app with all middleware, routes, and lifespan handlers.
Uses the lifespan pattern for startup/shutdown of database and Redis.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import v1_router
from app.api.auth import router as auth_router
from app.config import get_settings
from app.logging_config import configure_logging, get_logger
from app.middleware import RateLimitMiddleware, RequestIDMiddleware
from app.schemas.common import HealthResponse

# Configure structured JSON logging before anything else runs
configure_logging()
log = get_logger(__name__)


def _validate_env() -> None:
    """Crash fast if critical environment variables are missing.

    Called at the very top of lifespan so the error is visible immediately
    rather than surfacing as a cryptic 500 in the middle of a request.
    """
    settings = get_settings()
    errors: list[str] = []

    if not settings.google_api_key and not settings.anthropic_api_key and not settings.openai_api_key:
        errors.append(
            "At least one LLM API key is required: "
            "GOOGLE_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY"
        )

    if settings.api_key_hash_secret in ("change-me-in-production", ""):
        if "sqlite" not in settings.database_url:  # only enforce in prod
            errors.append("API_KEY_HASH_SECRET must be set to a strong random value in production")

    if errors:
        for err in errors:
            log.error("Environment validation failed", error=err)
        raise RuntimeError(
            "Startup aborted — fix the following environment variables:\n"
            + "\n".join(f"  • {e}" for e in errors)
        )


async def _seed_on_startup() -> None:
    """Seed the model registry and dev API key on first startup.

    Checks if the model_registry table is empty. If so, imports and runs
    the full seed from init_db.py. This is idempotent — a non-empty
    registry is left untouched.
    """
    import hashlib
    import uuid

    from sqlalchemy import func, select

    from app.db.models.api_key import ApiKey
    from app.db.models.model_registry import ModelRegistryEntry
    from app.db.session import async_session_factory

    async with async_session_factory() as session:
        count_result = await session.execute(
            select(func.count()).select_from(ModelRegistryEntry)
        )
        count = count_result.scalar_one()

        if count == 0:
            import sys
            sys.path.insert(0, ".")
            from init_db import MODELS_SEED  # noqa: PLC0415

            for m in MODELS_SEED:
                entry = ModelRegistryEntry(id=uuid.uuid4(), **m)
                session.add(entry)

            log.info("Model registry seeded", count=len(MODELS_SEED))
        else:
            log.info("Model registry already populated", count=count)

        # Ensure the dev API key exists
        settings = get_settings()
        raw_key = "arch_test_key_dev"
        key_hash = hashlib.sha256(
            (raw_key + settings.api_key_hash_secret).encode()
        ).hexdigest()

        existing_key = await session.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash)
        )
        if existing_key.scalar_one_or_none() is None:
            from app.db.models.user import User
            dev_result = await session.execute(
                select(User).where(User.email == "developer@archon.ai")
            )
            dev_user = dev_result.scalar_one_or_none()

            if dev_user is None:
                dev_user = User(
                    email="developer@archon.ai",
                    name="Dev User",
                    provider="dev",
                    provider_id="dev-user-001",
                )
                session.add(dev_user)
                await session.flush()

            session.add(ApiKey(
                id=uuid.uuid4(),
                user_id=dev_user.id,
                name="Dev Test Key",
                key_hash=key_hash,
                key_prefix=raw_key[:8],
                is_active=True,
            ))
            log.info("Dev API key created", key_prefix="arch_tes")

        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle — startup and shutdown."""
    # Validate environment early — crash immediately with a clear message
    _validate_env()

    settings = get_settings()
    log.info("Archon starting", version=settings.app_version)

    # ── Database ──────────────────────────────────────────────────
    from app.db.session import engine
    from app.db.base import Base
    import app.db.models as _models  # noqa: F401 — register all models

    # Enable pgvector extension on PostgreSQL (no-op on SQLite)
    try:
        async with engine.begin() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS vector")
            )
        log.info("pgvector extension enabled")
    except Exception:
        log.info("pgvector not available — knowledge base will use BM25 only")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    log.info("Database tables ready")

    # ── Seed ──────────────────────────────────────────────────────
    try:
        await _seed_on_startup()
    except Exception as exc:
        log.warning("Seed skipped", error=str(exc))

    # ── Redis ─────────────────────────────────────────────────────
    redis_client = None
    try:
        from app.cache.redis_client import create_redis_client
        redis_client = await create_redis_client()
        app.state.redis = redis_client
        log.info("Redis connected")
    except Exception as exc:
        log.warning("Redis unavailable — rate limiting disabled", error=str(exc))
        app.state.redis = None

    # ── Langfuse ──────────────────────────────────────────────────
    try:
        from app.observability.langfuse_tracer import get_tracer
        app.state.tracer = get_tracer()
        log.info("Langfuse tracer initialised")
    except Exception:
        app.state.tracer = None

    log.info("Archon ready")
    yield

    # ── Shutdown ──────────────────────────────────────────────────
    log.info("Archon shutting down")
    if redis_client:
        await redis_client.close()
    if hasattr(app.state, "tracer") and app.state.tracer:
        app.state.tracer.flush()
    log.info("Shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the Archon FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Archon — AI Systems Design Engine",
        description=(
            "API-first platform that accepts a natural language product idea "
            "and returns a complete AI stack blueprint. Powered by RAG retrieval, "
            "dynamic model scoring, and RAGAs evaluation."
        ),
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ── Middleware (last added = first executed) ──────────────────
    import os
    cors_raw = os.getenv("CORS_ORIGINS", "")
    cors_origins = [o.strip() for o in cors_raw.split(",") if o.strip()] or ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # ── Routes ───────────────────────────────────────────────────
    app.include_router(v1_router)
    app.include_router(auth_router)

    # ── Health check ─────────────────────────────────────────────
    @app.get(
        "/health",
        response_model=HealthResponse,
        tags=["Health"],
        summary="Health check",
    )
    async def health() -> HealthResponse:
        """Return service health status and version."""
        return HealthResponse(status="ok", version=settings.app_version)

    # ── Global exception handler ─────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        log.error(
            "Unhandled exception",
            request_id=request_id,
            path=str(request.url.path),
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later.",
                "request_id": request_id,
            },
        )

    return app


# Module-level instance for uvicorn: `uvicorn app.main:app`
app = create_app()
