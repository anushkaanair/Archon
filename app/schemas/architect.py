"""Pydantic models for POST /v1/architect.

Accepts a natural-language idea and kicks off the full pipeline
(analyze → RAG → recommend → architect → estimate → eval → explain).
Returns a job ID for async polling or a complete blueprint for sync mode.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import (
    BenchmarkCitation,
    DetectedTask,
    EvalScoreDetail,
    ModelRecommendation,
)


class ArchitectRequest(BaseModel):
    """Request body for the full blueprint generation endpoint."""

    input_text: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Natural-language product idea to generate a full blueprint for.",
        examples=["An AI-powered code review tool that catches security vulnerabilities in real-time."],
    )
    async_mode: bool = Field(
        True,
        description="If true, returns a job ID immediately (Celery). "
                    "If false, blocks until the blueprint is ready.",
    )
    budget_monthly_usd: float | None = Field(
        None,
        ge=0,
        description="Monthly budget cap in USD. None = unlimited.",
    )
    max_latency_ms: int | None = Field(
        None,
        ge=100,
        description="Maximum acceptable P95 latency in milliseconds.",
    )
    request_volume: int | None = Field(
        None,
        ge=0,
        description="Expected number of requests per month (used for cost projection).",
    )
    prefer_open_source: bool = Field(
        False,
        description="If true, bias model scoring toward open-source models.",
    )


class ArchitectResponse(BaseModel):
    """Response body for the blueprint generation endpoint."""

    blueprint_id: str | None = Field(None, description="UUID of the generated blueprint (sync mode).")
    job_id: str | None = Field(None, description="Celery task ID for async polling.")
    status: str = Field(..., description="Job status: 'pending', 'processing', 'completed', 'failed'.")

    # Available when status == 'completed'
    input_text: str | None = Field(None, description="Echo of the submitted input.")
    detected_tasks: list[DetectedTask] | None = Field(None, description="AI tasks detected.")
    recommendations: list[ModelRecommendation] | None = Field(None, description="Model recommendations.")
    architecture_json: dict | None = Field(None, description="Full workflow graph as JSON.")
    architecture_diagram: str | None = Field(None, description="Human-readable diagram (Mermaid).")
    cost_estimate: dict | None = Field(None, description="Monthly cost breakdown.")
    latency_estimate: dict | None = Field(None, description="P95 latency estimates.")
    explanation: str | None = Field(None, description="Plain-English reasoning for this stack.")
    benchmark_citations: list[BenchmarkCitation] | None = Field(None, description="Cited benchmark sources.")
    eval_score: EvalScoreDetail | None = Field(None, description="RAGAs evaluation scores.")
    confidence_flag: str | None = Field(None, description="'normal' or 'low_confidence'.")
    request_id: str | None = Field(None, description="Trace ID.")
