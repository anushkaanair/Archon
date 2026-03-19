"""Pydantic models for GET /v1/models.

Returns the full model registry with live pricing and benchmark data.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ModelEntry(BaseModel):
    """A single model in the registry."""

    id: str = Field(..., description="UUID of the registry entry.")
    provider: str = Field(..., description="Provider slug (e.g. 'openai', 'anthropic').")
    model_name: str = Field(..., description="Model identifier (e.g. 'gpt-4o').")
    model_version: str | None = Field(None, description="Version pin, if any.")
    capabilities: list[str] = Field(..., description="Supported task types.")
    pricing: dict = Field(..., description="Current pricing structure.")
    pricing_source: str = Field(..., description="URL to official pricing page.")
    pricing_fetched_at: datetime | None = Field(None, description="When pricing was last refreshed.")
    latency_p50_ms: int | None = Field(None, description="Median latency (ms).")
    latency_p95_ms: int | None = Field(None, description="P95 latency (ms).")
    latency_source: str | None = Field(None, description="Benchmark source for latency.")
    quality_scores: dict | None = Field(None, description="Quality benchmarks (MMLU, HumanEval, etc).")
    quality_source: str | None = Field(None, description="Benchmark source for quality.")
    is_active: bool = Field(..., description="Whether this model is available for recommendations.")


class ModelsResponse(BaseModel):
    """Response body for the model registry endpoint."""

    models: list[ModelEntry] = Field(..., description="All models in the registry.")
    total: int = Field(..., description="Total number of models.")
    cache_ttl_seconds: int = Field(..., description="How long this data is cached (seconds).")
    request_id: str | None = Field(None, description="Trace ID.")
