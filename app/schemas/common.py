"""Shared Pydantic models used across multiple endpoints.

Provides error responses, pagination, and common field types.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error envelope returned by all endpoints on failure."""

    error: str = Field(..., description="Machine-readable error code (e.g. 'validation_error').")
    message: str = Field(..., description="Human-readable error description.")
    request_id: str | None = Field(None, description="Request trace ID, if available.")


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str = Field("ok", description="Service health status.")
    version: str = Field(..., description="Application version.")


class DetectedTask(BaseModel):
    """A single AI task detected from user input."""

    task: str = Field(..., description="Task type slug (e.g. 'rag', 'image_generation', 'code_gen').")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence (0.0–1.0).")
    description: str = Field("", description="Brief explanation of why this task was detected.")


class ModelScore(BaseModel):
    """Weighted score breakdown for a model recommendation."""

    cost_score: float = Field(..., ge=0.0, le=1.0, description="Normalized cost efficiency score.")
    latency_score: float = Field(..., ge=0.0, le=1.0, description="Normalized latency score.")
    quality_score: float = Field(..., ge=0.0, le=1.0, description="Normalized quality/benchmark score.")
    task_fit_score: float = Field(..., ge=0.0, le=1.0, description="How well the model fits the task.")
    composite: float = Field(..., ge=0.0, le=1.0, description="Weighted composite score.")


class ModelRecommendation(BaseModel):
    """A single model recommendation with scores and metadata."""

    provider: str = Field(..., description="Model provider (e.g. 'openai').")
    model_name: str = Field(..., description="Model identifier (e.g. 'gpt-4o').")
    task: str = Field(..., description="The AI task this model is recommended for.")
    scores: ModelScore = Field(..., description="Detailed scoring breakdown.")
    pricing: dict = Field(..., description="Current pricing from the model registry.")
    pricing_source: str = Field(..., description="URL to the official pricing page.")
    rationale: str = Field("", description="Why this model was selected for this task.")


class BenchmarkCitation(BaseModel):
    """A cited benchmark source for cost or latency estimates."""

    metric: str = Field(..., description="What was measured (e.g. 'p95_latency', 'cost_per_1m_tokens').")
    value: str = Field(..., description="The measured value (e.g. '320ms', '$3.00').")
    source: str = Field(..., description="URL to the benchmark report or pricing page.")
    retrieved_at: datetime | None = Field(None, description="When this data was fetched.")


class EvalScoreDetail(BaseModel):
    """RAGAs evaluation breakdown."""

    faithfulness: float | None = Field(None, ge=0.0, le=1.0, description="Are claims supported by context?")
    answer_relevancy: float | None = Field(None, ge=0.0, le=1.0, description="Is the answer relevant?")
    context_precision: float | None = Field(None, ge=0.0, le=1.0, description="Are retrieved chunks precise?")
    context_recall: float | None = Field(None, ge=0.0, le=1.0, description="Do chunks cover the answer?")
    composite: float | None = Field(None, ge=0.0, le=1.0, description="Weighted composite score.")
    is_low_confidence: bool = Field(False, description="True if composite < 0.7 threshold.")
