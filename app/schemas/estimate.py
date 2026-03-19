"""Pydantic models for POST /v1/estimate.

Accepts an architecture JSON and returns cost + latency estimates with
cited benchmark sources.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import BenchmarkCitation


class EstimateRequest(BaseModel):
    """Request body for the cost/latency estimation endpoint."""

    blueprint_id: str | None = Field(
        None, description="UUID of an existing blueprint to estimate. Mutually exclusive with architecture_json."
    )
    architecture_json: dict | None = Field(
        None, description="Raw architecture JSON to estimate. Mutually exclusive with blueprint_id."
    )
    monthly_request_volume: int = Field(
        10000, ge=1, description="Estimated monthly request volume for cost projection."
    )
    avg_input_tokens: int = Field(
        500, ge=1, description="Average input tokens per request."
    )
    avg_output_tokens: int = Field(
        1000, ge=1, description="Average output tokens per request."
    )


class CostBreakdown(BaseModel):
    """Itemised cost estimate for a single model in the architecture."""

    model_name: str = Field(..., description="Model used.")
    provider: str = Field(..., description="Provider (e.g. 'openai').")
    role: str = Field(..., description="Role in the pipeline (e.g. 'primary_llm', 'embedder').")
    monthly_cost_usd: float = Field(..., description="Estimated monthly cost in USD.")
    cost_per_request_usd: float = Field(..., description="Cost per single request in USD.")
    pricing_source: str = Field(..., description="URL to the pricing page used for this estimate.")


class LatencyBreakdown(BaseModel):
    """Latency estimate for a single pipeline step."""

    step: str = Field(..., description="Pipeline step name (e.g. 'embedding', 'retrieval', 'llm').")
    p50_ms: int = Field(..., description="Median latency in ms.")
    p95_ms: int = Field(..., description="95th-percentile latency in ms.")
    source: str = Field(..., description="URL to the benchmark used.")


class EstimateResponse(BaseModel):
    """Response body for the cost/latency estimation endpoint."""

    total_monthly_cost_usd: float = Field(..., description="Total estimated monthly cost in USD.")
    total_p95_latency_ms: int = Field(..., description="Total estimated p95 latency for one request (ms).")
    cost_breakdown: list[CostBreakdown] = Field(..., description="Per-model cost breakdown.")
    latency_breakdown: list[LatencyBreakdown] = Field(..., description="Per-step latency breakdown.")
    benchmark_citations: list[BenchmarkCitation] = Field(..., description="All cited benchmark sources.")
    monthly_request_volume: int = Field(..., description="Volume used for projection.")
    request_id: str | None = Field(None, description="Trace ID.")
