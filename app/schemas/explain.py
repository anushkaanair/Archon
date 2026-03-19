"""Pydantic models for POST /v1/explain.

Accepts a blueprint ID and returns a plain-English explanation of the
recommended stack, including tradeoffs between cost, speed, and accuracy.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """Request body for the explanation endpoint."""

    blueprint_id: str = Field(
        ..., description="UUID of the blueprint to explain."
    )


class ExplainResponse(BaseModel):
    """Response body for the explanation endpoint."""

    blueprint_id: str = Field(..., description="UUID of the explained blueprint.")
    explanation: str = Field(
        ..., description="Plain-English explanation of why this stack was recommended."
    )
    tradeoffs: list[dict] = Field(
        default_factory=list,
        description="List of key tradeoffs considered: [{factor, choice, reasoning}].",
    )
    alternatives_considered: list[dict] = Field(
        default_factory=list,
        description="Alternative architectures that were evaluated but not chosen.",
    )
    request_id: str | None = Field(None, description="Trace ID.")
