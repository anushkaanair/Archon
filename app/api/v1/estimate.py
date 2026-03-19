"""POST /v1/estimate — Cost and latency estimation.

Accepts a blueprint ID or raw architecture JSON and returns itemised
cost and latency estimates with benchmark citations.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.blueprint import Blueprint
from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.observability.langfuse_tracer import get_tracer
from app.schemas.common import ErrorResponse
from app.schemas.estimate import EstimateRequest, EstimateResponse
from app.services.cost_simulator import estimate_costs, estimate_latency

router = APIRouter()


@router.post(
    "/estimate",
    response_model=EstimateResponse,
    status_code=status.HTTP_200_OK,
    summary="Estimate cost and latency for an architecture",
    description="Accepts a blueprint ID or raw architecture JSON and returns "
                "monthly cost estimates, p95 latency estimates, and all "
                "benchmark citations.",
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing API key"},
        404: {"model": ErrorResponse, "description": "Blueprint not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def estimate_endpoint(
    body: EstimateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    """Estimate monthly costs and p95 latency for an AI architecture.

    All estimates are computed from model pricing in the registry and
    published benchmarks — no hardcoded values. Every estimate includes
    a source citation.
    """
    request_id = getattr(request.state, "request_id", None)
    tracer = get_tracer()

    async with tracer.trace("estimate", request_id=request_id) as t:
        try:
            # Resolve architecture JSON
            arch_json = body.architecture_json

            if body.blueprint_id:
                result = await db.execute(
                    select(Blueprint).where(
                        Blueprint.id == body.blueprint_id,
                        Blueprint.user_id == user.id,
                        Blueprint.deleted_at.is_(None),
                    )
                )
                blueprint = result.scalar_one_or_none()
                if blueprint is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Blueprint not found.",
                    )
                arch_json = blueprint.architecture_json

            if arch_json is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Either blueprint_id or architecture_json must be provided.",
                )

            t.log_input({"volume": body.monthly_request_volume})

            # Run cost estimation
            cost_breakdowns, cost_citations = estimate_costs(
                arch_json,
                monthly_request_volume=body.monthly_request_volume,
                avg_input_tokens=body.avg_input_tokens,
                avg_output_tokens=body.avg_output_tokens,
            )

            # Run latency estimation
            latency_breakdowns, latency_citations = estimate_latency(arch_json)

            total_cost = sum(c.monthly_cost_usd for c in cost_breakdowns)
            total_latency = sum(l.p95_ms for l in latency_breakdowns)
            all_citations = cost_citations + latency_citations

            t.log_output({"total_cost": total_cost, "total_latency_ms": total_latency})

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Estimation failed: {str(e)}",
            )

    return EstimateResponse(
        total_monthly_cost_usd=round(total_cost, 4),
        total_p95_latency_ms=total_latency,
        cost_breakdown=cost_breakdowns,
        latency_breakdown=latency_breakdowns,
        benchmark_citations=all_citations,
        monthly_request_volume=body.monthly_request_volume,
        request_id=request_id,
    )
