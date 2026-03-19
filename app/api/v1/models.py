"""GET /v1/models — Model registry listing.

Returns all active models with pricing, latency benchmarks, and quality scores.
Data is cached in Redis with a 1-hour TTL.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.common import ErrorResponse
from app.schemas.models import ModelEntry, ModelsResponse
from app.services.model_registry_service import get_all_models

router = APIRouter()


@router.get(
    "/models",
    response_model=ModelsResponse,
    status_code=status.HTTP_200_OK,
    summary="List all models in the registry",
    description="Returns the full model registry with live pricing, "
                "latency benchmarks, and quality scores. Results are "
                "cached in Redis with a 1-hour TTL.",
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing API key"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def models_endpoint(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ModelsResponse:
    """List all active models in the Archon registry.

    Pricing and benchmark data are fetched from the database and cached
    in Redis (TTL 1 hour). The cache_ttl_seconds field tells clients
    how long the data is valid.
    """
    request_id = getattr(request.state, "request_id", None)
    settings = get_settings()
    redis_client = getattr(request.app.state, "redis", None)

    try:
        model_dicts = await get_all_models(db, redis_client)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch models: {str(e)}",
        )

    entries = [
        ModelEntry(**m) for m in model_dicts
    ]

    return ModelsResponse(
        models=entries,
        total=len(entries),
        cache_ttl_seconds=settings.model_registry_cache_ttl,
        request_id=request_id,
    )
