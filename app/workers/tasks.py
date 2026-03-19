"""Celery tasks for async blueprint generation.

The ``generate_blueprint_task`` runs the full Archon pipeline in the
background, persisting results to PostgreSQL. It uses exponential backoff
retry (max 3 attempts) and dead-letter handling for unrecoverable failures.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from celery import Task

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


class ArchonTask(Task):
    """Base task with exponential backoff retry and dead-letter logging."""

    autoretry_for = (Exception,)
    retry_backoff = True
    retry_backoff_max = 60
    max_retries = 3
    retry_jitter = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Log failed tasks for dead-letter analysis."""
        logger.error(
            "Task %s failed permanently after %d retries: %s",
            task_id,
            self.max_retries,
            str(exc),
            extra={"task_id": task_id, "args": args},
        )


@celery_app.task(base=ArchonTask, bind=True, name="archon.generate_blueprint")
def generate_blueprint_task(
    self: Task,
    query_id: str,
    user_id: str,
    input_text: str,
    request_id: str | None = None,
) -> dict[str, Any]:
    """Run the full Archon pipeline asynchronously.

    This task runs: semantic analysis → model recommendation →
    architecture generation → cost/latency estimation → RAGAs eval →
    LLM explanation. Results are persisted to the database.

    Args:
        query_id: UUID of the persisted query record.
        user_id: UUID of the requesting user.
        input_text: Natural-language product idea.
        request_id: Optional trace ID.

    Returns:
        Dict with blueprint_id and status.
    """
    # Run the async pipeline in a sync context (Celery workers are sync)
    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(
            _run_pipeline(query_id, user_id, input_text, request_id)
        )
        return result
    finally:
        loop.close()


async def _run_pipeline(
    query_id: str,
    user_id: str,
    input_text: str,
    request_id: str | None,
) -> dict[str, Any]:
    """Async pipeline execution for Celery.

    Creates its own database session since Celery workers
    don't share the FastAPI request lifecycle.
    """
    from app.db.models.blueprint import Blueprint
    from app.db.models.query import Query
    from app.db.session import async_session_factory
    from app.observability.langfuse_tracer import get_tracer
    from app.services.architecture_generator import generate_architecture
    from app.services.cost_simulator import estimate_costs, estimate_latency
    from app.services.eval_engine import evaluate_recommendation
    from app.services.model_strategy import recommend_models
    from app.services.reasoning_engine import generate_explanation
    from app.services.semantic_analyzer import detect_tasks

    tracer = get_tracer()

    async with async_session_factory() as db:
        try:
            async with tracer.trace("architect_async", request_id=request_id) as t:
                t.log_input({"query_id": query_id, "input_text": input_text[:200]})

                # 1. Semantic analysis
                detected = detect_tasks(input_text)
                task_dicts = [
                    {"task": d.task, "confidence": d.confidence, "description": d.description}
                    for d in detected
                ]

                # Update query with detected tasks
                from sqlalchemy import select, update
                await db.execute(
                    update(Query)
                    .where(Query.id == query_id)
                    .values(detected_tasks=task_dicts, status="processing")
                )

                # 2. Model recommendations
                recommendations = await recommend_models(
                    detected_tasks=task_dicts, db=db
                )

                # 3. Architecture generation
                arch_json, arch_diagram = generate_architecture(
                    input_text, task_dicts, recommendations
                )

                # 4. Cost + latency
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

                # 5. Eval
                answer_text = f"Architecture with {len(recommendations)} models"
                eval_result = await evaluate_recommendation(
                    question=input_text, answer=answer_text, contexts=[]
                )

                # 6. Explanation
                explanation_data = await generate_explanation(
                    input_text=input_text,
                    detected_tasks=task_dicts,
                    recommendations=[r.model_dump() for r in recommendations],
                    architecture_json=arch_json,
                    cost_estimate=cost_estimate,
                    latency_estimate=latency_estimate,
                )

                # 7. Persist blueprint
                all_citations = cost_citations + latency_citations
                confidence_flag = "low_confidence" if eval_result.is_low_confidence else "normal"

                blueprint = Blueprint(
                    query_id=query_id,
                    user_id=user_id,
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

                # Update query status
                await db.execute(
                    update(Query).where(Query.id == query_id).values(status="completed")
                )

                await db.commit()

                t.log_output({"blueprint_id": str(blueprint.id)})
                t.log_eval(eval_result.composite or 0.0, eval_result.model_dump())

                return {"blueprint_id": str(blueprint.id), "status": "completed"}

        except Exception as e:
            await db.rollback()
            # Update query status to failed
            await db.execute(
                update(Query).where(Query.id == query_id).values(status="failed")
            )
            await db.commit()
            logger.error("Pipeline failed for query %s: %s", query_id, str(e))
            raise
