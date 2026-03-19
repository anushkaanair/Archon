"""Pydantic models for POST /v1/analyze.

Accepts a natural-language product idea and returns detected AI tasks
with confidence scores.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import DetectedTask


class AnalyzeRequest(BaseModel):
    """Request body for the semantic analysis endpoint."""

    input_text: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Natural-language product idea to analyze for AI task detection.",
        examples=["A legal document Q&A bot for law firms with citation tracking and multi-language support."],
    )


class AnalyzeResponse(BaseModel):
    """Response body for the semantic analysis endpoint."""

    input_text: str = Field(..., description="Echo of the submitted input text.")
    detected_tasks: list[DetectedTask] = Field(
        ..., description="AI tasks detected from the input, sorted by confidence descending."
    )
    query_id: str = Field(..., description="UUID of the persisted query record.")
    request_id: str | None = Field(None, description="Trace ID for this request.")
