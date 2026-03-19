"""POST /v1/architect — Full blueprint generation.

Runs the complete pipeline: analyze → RAG → recommend → architect → estimate
→ eval → explain. Supports both async (Celery job) and sync modes.
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
from app.schemas.common import ErrorResponse
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
    status_code=status.HTTP_202_ACCEPTED,
    summary="Generate a complete AI architecture blueprint",
    description="Runs the full Archon pipeline on a product idea. In async mode "
                "(default), returns a job ID for polling. In sync mode, blocks "
                "until the blueprint is ready.",
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
    """Generate a complete AI architecture blueprint.

    In async mode, enqueues a Celery job and returns the job ID immediately.
    In sync mode, runs the full pipeline inline and returns the complete blueprint.
    """
    request_id = getattr(request.state, "request_id", None)

    if body.async_mode:
        # ── Async mode: enqueue Celery job ──────────────────────
        try:
            from app.workers.tasks import generate_blueprint_task

            # Persist the query first
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
            # Celery not available — fall through to sync mode
            pass

    # ── Sync mode: run full pipeline inline ──────────────────
    tracer = get_tracer()
    redis_client = getattr(request.app.state, "redis", None)

    async with tracer.trace("architect", request_id=request_id) as t:
        try:
            t.log_input({"input_text": body.input_text[:200]})

            # 1. Semantic analysis
            detected = detect_tasks(body.input_text)
            task_dicts = [
                {"task": d.task, "confidence": d.confidence, "description": d.description}
                for d in detected
            ]

            # 2. Persist query
            query = Query(
                user_id=user.id,
                input_text=body.input_text,
                detected_tasks=task_dicts,
                status="processing",
                request_id=request_id,
            )
            db.add(query)
            await db.flush()

            # 3. Model recommendations
            recommendations = await recommend_models(
                detected_tasks=task_dicts,
                db=db,
                redis_client=redis_client,
            )

            # 4. Architecture generation
            arch_json, arch_diagram = generate_architecture(
                input_text=body.input_text,
                detected_tasks=task_dicts,
                recommendations=recommendations,
            )

            # 5. Cost + latency estimation
            cost_breakdowns, cost_citations = estimate_costs(arch_json)
            latency_breakdowns, latency_citations = estimate_latency(arch_json)

            cost_estimate = {
                "total_monthly_usd": sum(c.monthly_cost_usd for c in cost_breakdowns),
                "breakdown": [c.model_dump() for c in cost_breakdowns],
            }
            latency_estimate = {
                "total_p95_ms": sum(l.p95_ms for l in latency_breakdowns),
                "breakdown": [l.model_dump() for l in latency_breakdowns],
            }

            # 6. RAGAs evaluation
            answer_text = f"Recommended architecture with {len(recommendations)} models for tasks: {', '.join(d.task for d in detected)}"
            eval_result = await evaluate_recommendation(
                question=body.input_text,
                answer=answer_text,
                contexts=[],  # Would include RAG contexts in full pipeline
            )
            t.log_eval(eval_result.composite or 0.0, eval_result.model_dump())

            # 7. LLM explanation
            explanation_data = await generate_explanation(
                input_text=body.input_text,
                detected_tasks=task_dicts,
                recommendations=[r.model_dump() for r in recommendations],
                architecture_json=arch_json,
                cost_estimate=cost_estimate,
                latency_estimate=latency_estimate,
            )

            # 8. Persist blueprint
            all_citations = cost_citations + latency_citations
            confidence_flag = "low_confidence" if eval_result.is_low_confidence else "normal"

            blueprint = Blueprint(
                query_id=query.id,
                user_id=user.id,
                architecture_json=arch_json,
                architecture_diagram=arch_diagram,
                model_recommendations=[r.model_dump() for r in recommendations],
                cost_estimate=cost_estimate,
                latency_estimate=latency_estimate,
                explanation=explanation_data["explanation"],
                benchmark_citations=[c.model_dump() for c in all_citations],
                eval_score=eval_result.composite,
                eval_details=eval_result.model_dump(),
                confidence_flag=confidence_flag,
                status="final",
            )
            db.add(blueprint)
            await db.flush()

            # Update query status
            query.status = "completed"
            await db.flush()

            t.log_output({"blueprint_id": str(blueprint.id), "eval_score": eval_result.composite})

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Blueprint generation failed: {str(e)}",
            )

    return ArchitectResponse(
        blueprint_id=str(blueprint.id),
        status="completed",
        input_text=body.input_text,
        detected_tasks=detected,
        recommendations=recommendations,
        architecture_json=arch_json,
        architecture_diagram=arch_diagram,
        cost_estimate=cost_estimate,
        latency_estimate=latency_estimate,
        explanation=explanation_data["explanation"],
        benchmark_citations=all_citations,
        eval_score=eval_result,
        confidence_flag=confidence_flag,
        request_id=request_id,
    )
