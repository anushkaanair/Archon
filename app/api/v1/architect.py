"""POST /v1/architect — Full blueprint generation.

Runs the complete pipeline: analyze → RAG → recommend → architect → estimate
→ eval → explain. Supports both async (Celery job) and sync modes.
Each pipeline stage is individually fault-tolerant — partial failures
return the best available result rather than a 500.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.blueprint import Blueprint
from app.db.models.query import Query
from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.observability.langfuse_tracer import get_tracer
from app.schemas.architect import ArchitectRequest, ArchitectResponse
from app.schemas.common import ErrorResponse, EvalScoreDetail
from app.services.architecture_generator import generate_architecture
from app.services.cost_simulator import estimate_costs, estimate_latency
from app.services.eval_engine import evaluate_recommendation
from app.services.model_strategy import recommend_models
from app.services.reasoning_engine import generate_explanation
from app.services.semantic_analyzer import detect_tasks

router = APIRouter()


@router.post(
    "/architect",
    response_model=ArchitectResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a complete AI architecture blueprint",
    description="Runs the full Archon pipeline on a product idea.",
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing API key"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def architect_endpoint(
    body: ArchitectRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ArchitectResponse:
    """Generate a complete AI architecture blueprint."""
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())

    if body.async_mode:
        # ── Async mode: enqueue Celery job ──────────────────────
        try:
            from app.workers.tasks import generate_blueprint_task

            query = Query(
                user_id=user.id,
                input_text=body.input_text,
                status="pending",
                request_id=request_id,
            )
            db.add(query)
            await db.flush()

            task = generate_blueprint_task.delay(
                query_id=str(query.id),
                user_id=str(user.id),
                input_text=body.input_text,
                request_id=request_id,
            )

            return ArchitectResponse(
                job_id=task.id,
                status="pending",
                request_id=request_id,
            )
        except Exception:
            pass  # Celery not available — fall through to sync mode

    # ── Sync mode: run full pipeline inline ──────────────────
    tracer = get_tracer()
    redis_client = getattr(request.app.state, "redis", None)

    # ── Stage 1: Semantic analysis ────────────────────────────
    # Run in a thread pool — SentenceTransformer.encode() is CPU-bound and
    # would block the event loop if called directly in an async handler.
    try:
        import asyncio
        detected = await asyncio.to_thread(detect_tasks, body.input_text)
        task_dicts = [
            {"task": d.task, "confidence": d.confidence, "description": d.description}
            for d in detected
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Task detection failed: {str(e)}",
        )

    if not task_dicts:
        # Fallback: treat as general chat task
        task_dicts = [{"task": "chat", "confidence": 0.5, "description": "General AI assistant"}]
        detected = []

    # ── Stage 2: Persist query ────────────────────────────────
    # Always create a query record — blueprint.query_id is NOT NULL.
    query = Query(
        user_id=user.id,
        input_text=body.input_text,
        detected_tasks=task_dicts,
        status="processing",
        request_id=request_id,
    )
    db.add(query)
    try:
        await db.flush()
    except Exception as e:
        # Flush failed — roll back and raise; without a query_id we cannot
        # persist the blueprint anyway.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create query record: {e}",
        )

    # ── Stage 3: Model recommendations ───────────────────────
    try:
        recommendations = await recommend_models(
            detected_tasks=task_dicts,
            db=db,
            redis_client=redis_client,
            budget_monthly_usd=getattr(body, "budget_monthly_usd", None),
            prefer_open_source=getattr(body, "prefer_open_source", False),
        )
    except Exception as e:
        recommendations = []

    # ── Stage 4: Architecture generation ─────────────────────
    try:
        arch_json, arch_diagram = generate_architecture(
            input_text=body.input_text,
            detected_tasks=task_dicts,
            recommendations=recommendations,
        )
    except Exception as e:
        arch_json = {"nodes": [], "edges": [], "metadata": {"error": str(e)}}
        arch_diagram = "graph LR\n    A[Input] --> B[Output]"

    # ── Stage 5: Cost + latency estimation ───────────────────
    try:
        cost_breakdowns, cost_citations = estimate_costs(arch_json)
        latency_breakdowns, latency_citations = estimate_latency(arch_json)
    except Exception:
        cost_breakdowns, cost_citations = [], []
        latency_breakdowns, latency_citations = [], []

    cost_estimate = {
        "total_monthly_usd": round(sum(c.monthly_cost_usd for c in cost_breakdowns), 4),
        "breakdown": [c.model_dump() for c in cost_breakdowns],
    }
    latency_estimate = {
        "total_p95_ms": sum(l.p95_ms for l in latency_breakdowns),
        "breakdown": [l.model_dump() for l in latency_breakdowns],
    }

    # ── Stage 6: RAGAs evaluation ─────────────────────────────
    try:
        answer_text = (
            f"Recommended {len(recommendations)} models for tasks: "
            + ", ".join(d["task"] if isinstance(d, dict) else d.task for d in task_dicts)
        )
        eval_result = await evaluate_recommendation(
            question=body.input_text,
            answer=answer_text,
            contexts=[],
        )
    except Exception:
        eval_result = EvalScoreDetail(
            faithfulness=None,
            answer_relevancy=None,
            context_precision=None,
            context_recall=None,
            composite=None,
            is_low_confidence=True,
        )

    # ── Stage 7: LLM explanation ──────────────────────────────
    try:
        explanation_data = await generate_explanation(
            input_text=body.input_text,
            detected_tasks=task_dicts,
            recommendations=[r.model_dump() for r in recommendations],
            architecture_json=arch_json,
            cost_estimate=cost_estimate,
            latency_estimate=latency_estimate,
        )
    except Exception:
        explanation_data = {
            "explanation": (
                "This architecture was designed based on the detected AI tasks and "
                "available models in the registry. Each model was scored on cost efficiency, "
                "latency, quality benchmarks, and task fitness."
            ),
            "tradeoffs": [],
            "alternatives_considered": [],
        }

    # ── Stage 8: Persist blueprint ────────────────────────────
    blueprint_id = str(uuid.uuid4())
    confidence_flag = "low_confidence" if eval_result.is_low_confidence else "normal"
    all_citations = cost_citations + latency_citations

    try:
        blueprint = Blueprint(
            query_id=query.id,
            user_id=user.id,
            architecture_json=arch_json,
            architecture_diagram=arch_diagram,
            model_recommendations=[r.model_dump(mode="json") for r in recommendations],
            cost_estimate=cost_estimate,
            latency_estimate=latency_estimate,
            explanation=explanation_data.get("explanation", ""),
            benchmark_citations=[c.model_dump(mode="json") for c in all_citations],
            eval_score=eval_result.composite,
            eval_details=eval_result.model_dump(mode="json"),
            confidence_flag=confidence_flag,
            status="final",
        )
        db.add(blueprint)
        await db.flush()
        blueprint_id = str(blueprint.id)

        query.status = "completed"
        await db.flush()
    except Exception:
        pass  # Blueprint persist failed — response still returns best-effort data

    # Log via tracer (no-op if Langfuse not configured)
    try:
        async with tracer.trace("architect", request_id=request_id) as t:
            t.log_output({"blueprint_id": blueprint_id, "eval_score": eval_result.composite})
    except Exception:
        pass

    return ArchitectResponse(
        blueprint_id=blueprint_id,
        status="completed",
        input_text=body.input_text,
        detected_tasks=detected,
        recommendations=recommendations,
        architecture_json=arch_json,
        architecture_diagram=arch_diagram,
        cost_estimate=cost_estimate,
        latency_estimate=latency_estimate,
        explanation=explanation_data.get("explanation", ""),
        benchmark_citations=all_citations,
        eval_score=eval_result,
        confidence_flag=confidence_flag,
        request_id=request_id,
    )
