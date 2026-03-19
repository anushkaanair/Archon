"""POST /v1/analyze — Semantic task detection.

Accepts a natural-language product idea and returns detected AI tasks
with confidence scores.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.query import Query
from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.observability.langfuse_tracer import get_tracer
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.schemas.common import ErrorResponse
from app.services.semantic_analyzer import detect_tasks

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect AI tasks from a product idea",
    description="Accepts a natural-language product idea and uses sentence-transformer "
                "embeddings to detect AI tasks (RAG, code gen, image gen, etc.) with "
                "confidence scores.",
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing API key"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def analyze_endpoint(
    body: AnalyzeRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyzeResponse:
    """Detect AI tasks from a natural-language product idea.

    Runs the semantic analysis layer using sentence-transformer embeddings
    to classify the input into AI task categories. Results are persisted
    as a Query record for pipeline linking.
    """
    request_id = getattr(request.state, "request_id", None)
    tracer = get_tracer()

    async with tracer.trace("analyze", request_id=request_id) as t:
        try:
            t.log_input({"input_text": body.input_text[:200]})  # Truncate for logging

            # Detect tasks
            detected = detect_tasks(body.input_text)

            # Persist query
            query = Query(
                user_id=user.id,
                input_text=body.input_text,
                detected_tasks=[
                    {"task": d.task, "confidence": d.confidence, "description": d.description}
                    for d in detected
                ],
                status="completed",
                request_id=request_id,
            )
            db.add(query)
            await db.flush()

            t.log_output({"detected_tasks": len(detected)})
        except Exception as e:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Semantic analysis failed: {str(e)}",
            )

    return AnalyzeResponse(
        input_text=body.input_text,
        detected_tasks=detected,
        query_id=str(query.id),
        request_id=request_id,
    )
