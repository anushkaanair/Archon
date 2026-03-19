"""Pydantic models for POST /v1/recommend.

Accepts detected AI tasks and returns ranked model recommendations.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import DetectedTask, ModelRecommendation


class RecommendRequest(BaseModel):
    """Request body for the model recommendation endpoint."""

    query_id: str = Field(
        ..., description="UUID of the query from /v1/analyze to link recommendations."
    )
    detected_tasks: list[DetectedTask] = Field(
        ..., min_length=1, description="AI tasks to find model recommendations for."
    )
    budget_monthly_usd: float | None = Field(
        None, ge=0, description="Optional monthly budget cap in USD for filtering."
    )
    prefer_open_source: bool = Field(
        False, description="If true, rank open-source models higher."
    )


class RecommendResponse(BaseModel):
    """Response body for the model recommendation endpoint."""

    query_id: str = Field(..., description="UUID of the linked query.")
    recommendations: list[ModelRecommendation] = Field(
        ..., description="Ranked model recommendations per detected task."
    )
    total_estimated_monthly_cost: float | None = Field(
        None, description="Sum of estimated monthly costs for all recommended models."
    )
    request_id: str | None = Field(None, description="Trace ID for this request.")
