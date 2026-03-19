"""POST /v1/recommend — Model recommendations.

Accepts detected AI tasks and returns ranked model recommendations
with detailed scoring breakdown.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.observability.langfuse_tracer import get_tracer
from app.schemas.common import ErrorResponse
from app.schemas.recommend import RecommendRequest, RecommendResponse
from app.services.model_strategy import recommend_models

router = APIRouter()


@router.post(
    "/recommend",
    response_model=RecommendResponse,
    status_code=status.HTTP_200_OK,
    summary="Get model recommendations for detected tasks",
    description="Accepts a list of detected AI tasks and returns ranked model "
                "recommendations. Each model is scored on cost, latency, quality, "
                "and task fit.",
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing API key"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def recommend_endpoint(
    body: RecommendRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RecommendResponse:
    """Generate ranked model recommendations for detected AI tasks.

    Queries the model registry, scores each model on four dimensions
    (cost, latency, quality, task fit), and returns a composite-ranked list.
    """
    request_id = getattr(request.state, "request_id", None)
    tracer = get_tracer()
    redis_client = getattr(request.app.state, "redis", None)

    async with tracer.trace("recommend", request_id=request_id) as t:
        try:
            t.log_input({"query_id": body.query_id, "tasks": len(body.detected_tasks)})

            task_dicts = [
                {"task": dt.task, "confidence": dt.confidence}
                for dt in body.detected_tasks
            ]

            recommendations = await recommend_models(
                detected_tasks=task_dicts,
                db=db,
                redis_client=redis_client,
                budget_monthly_usd=body.budget_monthly_usd,
                prefer_open_source=body.prefer_open_source,
            )

            # Calculate total estimated cost if recommendations exist
            total_cost = None
            if recommendations:
                prices = []
                for r in recommendations:
                    p = r.pricing
                    estimated = (
                        p.get("input_per_1m_tokens", 0) * 10
                        + p.get("output_per_1m_tokens", 0) * 5
                    )
                    prices.append(estimated)
                total_cost = round(sum(prices), 2)

            t.log_output({"recommendations": len(recommendations), "total_cost": total_cost})
        except Exception as e:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Recommendation failed: {str(e)}",
            )

    return RecommendResponse(
        query_id=body.query_id,
        recommendations=recommendations,
        total_estimated_monthly_cost=total_cost,
        request_id=request_id,
    )
