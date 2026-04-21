"""Dashboard stats and blueprint history endpoints.

GET /v1/dashboard/stats  — real counts from the DB
GET /v1/blueprints       — list user's past blueprints
GET /v1/blueprints/{id}  — fetch a single blueprint
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.blueprint import Blueprint
from app.db.models.query import Query
from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/dashboard/stats", summary="Get real-time dashboard statistics")
async def dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return real counts from the database for this user."""

    # Total blueprints
    bp_count_result = await db.execute(
        select(func.count()).select_from(Blueprint).where(
            Blueprint.user_id == user.id,
            Blueprint.deleted_at.is_(None),
        )
    )
    total_blueprints = bp_count_result.scalar_one() or 0

    # Average eval score
    avg_score_result = await db.execute(
        select(func.avg(Blueprint.eval_score)).where(
            Blueprint.user_id == user.id,
            Blueprint.eval_score.is_not(None),
            Blueprint.deleted_at.is_(None),
        )
    )
    avg_score = avg_score_result.scalar_one()

    # Total estimated monthly cost (sum of cost_estimate.total_monthly_usd)
    bp_result = await db.execute(
        select(Blueprint.cost_estimate).where(
            Blueprint.user_id == user.id,
            Blueprint.deleted_at.is_(None),
        )
    )
    blueprints_costs = bp_result.scalars().all()
    total_cost = sum(
        (b.get("total_monthly_usd", 0) or 0)
        for b in blueprints_costs
        if b and isinstance(b, dict)
    )

    # Models evaluated (total recommendations across blueprints)
    recs_result = await db.execute(
        select(Blueprint.model_recommendations).where(
            Blueprint.user_id == user.id,
            Blueprint.deleted_at.is_(None),
        )
    )
    all_recs = recs_result.scalars().all()
    models_evaluated = sum(len(r) if r else 0 for r in all_recs)

    return {
        "total_blueprints": total_blueprints,
        "avg_eval_score": round(avg_score, 3) if avg_score else None,
        "total_estimated_monthly_cost_usd": round(total_cost, 2),
        "models_evaluated": models_evaluated,
    }


@router.get("/blueprints", summary="List user's blueprints")
async def list_blueprints(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return a paginated list of the user's blueprints (newest first)."""

    result = await db.execute(
        select(Blueprint)
        .where(Blueprint.user_id == user.id, Blueprint.deleted_at.is_(None))
        .order_by(Blueprint.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    blueprints = result.scalars().all()

    items = []
    for bp in blueprints:
        # Fetch the associated query for input_text
        q_result = await db.execute(select(Query).where(Query.id == bp.query_id))
        query = q_result.scalar_one_or_none()

        items.append({
            "blueprint_id": str(bp.id),
            "input_text": query.input_text if query else "",
            "status": bp.status,
            "eval_score": bp.eval_score,
            "confidence_flag": bp.confidence_flag,
            "total_monthly_cost_usd": (
                bp.cost_estimate.get("total_monthly_usd", 0)
                if bp.cost_estimate else 0
            ),
            "total_p95_ms": (
                bp.latency_estimate.get("total_p95_ms", 0)
                if bp.latency_estimate else 0
            ),
            "model_count": len(bp.model_recommendations or []),
            "created_at": bp.created_at.isoformat() if bp.created_at else None,
        })

    return {"items": items, "total": len(items), "limit": limit, "offset": offset}


@router.get("/blueprints/{blueprint_id}", summary="Fetch a single blueprint")
async def get_blueprint(
    blueprint_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return full blueprint details."""

    result = await db.execute(
        select(Blueprint).where(
            Blueprint.id == blueprint_id,
            Blueprint.user_id == user.id,
            Blueprint.deleted_at.is_(None),
        )
    )
    bp = result.scalar_one_or_none()

    if not bp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blueprint not found.")

    q_result = await db.execute(select(Query).where(Query.id == bp.query_id))
    query = q_result.scalar_one_or_none()

    return {
        "blueprint_id": str(bp.id),
        "input_text": query.input_text if query else "",
        "status": bp.status,
        "architecture_json": bp.architecture_json,
        "architecture_diagram": bp.architecture_diagram,
        "model_recommendations": bp.model_recommendations,
        "cost_estimate": bp.cost_estimate,
        "latency_estimate": bp.latency_estimate,
        "explanation": bp.explanation,
        "benchmark_citations": bp.benchmark_citations,
        "eval_score": bp.eval_score,
        "eval_details": bp.eval_details,
        "confidence_flag": bp.confidence_flag,
        "created_at": bp.created_at.isoformat() if bp.created_at else None,
    }
