"""POST /v1/explain — Blueprint explanation.

Accepts a blueprint ID and returns a plain-English explanation of why
the stack was recommended, including tradeoffs and alternatives.
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
from app.schemas.explain import ExplainRequest, ExplainResponse
from app.services.reasoning_engine import generate_explanation

router = APIRouter()


@router.post(
    "/explain",
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a plain-English explanation of a blueprint",
    description="Accepts a blueprint ID and generates a human-readable "
                "explanation of the recommended architecture, including "
                "tradeoffs and alternatives considered.",
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing API key"},
        404: {"model": ErrorResponse, "description": "Blueprint not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def explain_endpoint(
    body: ExplainRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExplainResponse:
    """Generate a plain-English explanation for a blueprint.

    Uses an LLM to synthesise an explanation grounded in the retrieved
    RAG context, model scores, and cost/latency estimates. Every
    explanation includes tradeoffs and alternatives considered.
    """
    request_id = getattr(request.state, "request_id", None)
    tracer = get_tracer()

    async with tracer.trace("explain", request_id=request_id) as t:
        try:
            # Load the blueprint
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

            t.log_input({"blueprint_id": body.blueprint_id})

            # If explanation already exists, return it
            if blueprint.explanation:
                return ExplainResponse(
                    blueprint_id=body.blueprint_id,
                    explanation=blueprint.explanation,
                    tradeoffs=[],
                    alternatives_considered=[],
                    request_id=request_id,
                )

            # Generate new explanation
            # Load the parent query for context
            from app.db.models.query import Query
            q_result = await db.execute(select(Query).where(Query.id == blueprint.query_id))
            query = q_result.scalar_one_or_none()
            input_text = query.input_text if query else ""

            explanation_data = await generate_explanation(
                input_text=input_text,
                detected_tasks=query.detected_tasks if query else [],
                recommendations=blueprint.model_recommendations,
                architecture_json=blueprint.architecture_json,
                cost_estimate=blueprint.cost_estimate,
                latency_estimate=blueprint.latency_estimate,
            )

            # Persist the explanation
            blueprint.explanation = explanation_data["explanation"]
            await db.flush()

            t.log_output({"explanation_length": len(explanation_data["explanation"])})

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Explanation generation failed: {str(e)}",
            )

    return ExplainResponse(
        blueprint_id=body.blueprint_id,
        explanation=explanation_data["explanation"],
        tradeoffs=explanation_data.get("tradeoffs", []),
        alternatives_considered=explanation_data.get("alternatives_considered", []),
        request_id=request_id,
    )
