"""FastAPI application factory.

Creates the Archon app with all middleware, routes, and lifespan handlers.
Uses the lifespan pattern for startup/shutdown of database, Redis, and
Qdrant connections.
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
from app.middleware import RateLimitMiddleware, RequestIDMiddleware
from app.schemas.common import HealthResponse


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
        # Check if model registry is already populated
        count_result = await session.execute(
            select(func.count()).select_from(ModelRegistryEntry)
        )
        count = count_result.scalar_one()

        if count == 0:
            # Import seed data without executing the __main__ block
            import sys
            sys.path.insert(0, ".")
            from init_db import MODELS_SEED  # noqa: PLC0415

            for m in MODELS_SEED:
                entry = ModelRegistryEntry(id=uuid.uuid4(), **m)
                session.add(entry)

            print(f"[startup] Seeded {len(MODELS_SEED)} models into model_registry.")
        else:
            print(f"[startup] Model registry already has {count} entries — skipping seed.")

        # Ensure the dev API key exists (used by Builder.tsx fallback)
        settings = get_settings()
        raw_key = "arch_test_key_dev"
        key_hash = hashlib.sha256(
            (raw_key + settings.api_key_hash_secret).encode()
        ).hexdigest()

        existing_key = await session.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash)
        )
        if existing_key.scalar_one_or_none() is None:
            # Find or create a dev user for this key
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
            print("[startup] Created dev API key 'arch_test_key_dev'.")

        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle — startup and shutdown.

    On startup:
    - Initialise Redis connection pool
    - Initialise Qdrant client
    - Initialise Langfuse tracer

    On shutdown:
    - Close Redis connection
    - Close Qdrant connection
    - Flush Langfuse traces
    """
    settings = get_settings()

    # ── Startup ──────────────────────────────────────────────────
    # Database — ensure all tables exist (safe no-op if already up to date)
    from app.db.session import engine
    from app.db.base import Base
    import app.db.models as _models  # noqa: F401 — register all models with metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed model registry + dev API key if the registry is empty
    try:
        await _seed_on_startup()
    except Exception as e:
        print(f"[startup] Seed skipped: {e}")

    # Redis
    redis_client = None
    try:
        from app.cache.redis_client import create_redis_client
        redis_client = await create_redis_client()
        app.state.redis = redis_client
    except Exception:
        app.state.redis = None

    # Qdrant
    try:
        from qdrant_client import AsyncQdrantClient
        qdrant_client = AsyncQdrantClient(url=settings.qdrant_url, timeout=2.0)
        # Verify connection
        await qdrant_client.get_collections()
        app.state.qdrant = qdrant_client
    except Exception:
        # Fallback to in-memory Qdrant client
        from qdrant_client import AsyncQdrantClient
        print("Falling back to in-memory Qdrant")
        app.state.qdrant = AsyncQdrantClient(location=":memory:")


    # Langfuse
    try:
        from app.observability.langfuse_tracer import get_tracer
        app.state.tracer = get_tracer()
    except Exception:
        app.state.tracer = None

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    if redis_client:
        await redis_client.close()

    if hasattr(app.state, "qdrant") and app.state.qdrant:
        await app.state.qdrant.close()

    if hasattr(app.state, "tracer") and app.state.tracer:
        app.state.tracer.flush()


def create_app() -> FastAPI:
    """Create and configure the Archon FastAPI application.

    This factory function builds the app with:
    - Versioned API routes (/v1/)
    - Request ID middleware
    - Rate limiting middleware (Redis-backed)
    - CORS middleware
    - Global exception handlers
    - Health check endpoint
    - Auto-generated OpenAPI documentation
    """
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

    # ── Middleware (order matters — last added = first executed) ──
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
        """Catch-all error handler ensuring consistent error format.

        Logs the error with request ID for tracing but does not expose
        internal details to the client.
        """
        request_id = getattr(request.state, "request_id", None)
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
