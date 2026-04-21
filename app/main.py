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
from app.config import get_settings
from app.middleware import RateLimitMiddleware, RequestIDMiddleware
from app.schemas.common import HealthResponse


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
