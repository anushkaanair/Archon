"""Typed response models for the Archon SDK.

Every API response is deserialised into one of these dataclasses for
type-safe access. All fields have type hints compatible with Python 3.9+.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class DetectedTask:
    """A single AI task detected from user input."""

    task: str
    confidence: float
    description: str = ""


@dataclass
class ModelScore:
    """Weighted score breakdown for a model recommendation."""

    cost_score: float
    latency_score: float
    quality_score: float
    task_fit_score: float
    composite: float


@dataclass
class ModelRecommendation:
    """A single model recommendation with scores and metadata."""

    provider: str
    model_name: str
    task: str
    scores: ModelScore
    pricing: Dict[str, Any] = field(default_factory=dict)
    pricing_source: str = ""
    rationale: str = ""


@dataclass
class BenchmarkCitation:
    """A cited benchmark source."""

    metric: str
    value: str
    source: str
    retrieved_at: Optional[str] = None


@dataclass
class EvalScore:
    """RAGAs evaluation breakdown."""

    faithfulness: Optional[float] = None
    answer_relevancy: Optional[float] = None
    context_precision: Optional[float] = None
    context_recall: Optional[float] = None
    composite: Optional[float] = None
    is_low_confidence: bool = False


@dataclass
class AnalyzeResult:
    """Response from POST /v1/analyze."""

    input_text: str
    detected_tasks: List[DetectedTask]
    query_id: str
    request_id: Optional[str] = None


@dataclass
class RecommendResult:
    """Response from POST /v1/recommend."""

    query_id: str
    recommendations: List[ModelRecommendation]
    total_estimated_monthly_cost: Optional[float] = None
    request_id: Optional[str] = None


@dataclass
class ArchitectResult:
    """Response from POST /v1/architect."""

    status: str
    blueprint_id: Optional[str] = None
    job_id: Optional[str] = None
    input_text: Optional[str] = None
    detected_tasks: Optional[List[DetectedTask]] = None
    recommendations: Optional[List[ModelRecommendation]] = None
    architecture_json: Optional[Dict[str, Any]] = None
    architecture_diagram: Optional[str] = None
    cost_estimate: Optional[Dict[str, Any]] = None
    latency_estimate: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    benchmark_citations: Optional[List[BenchmarkCitation]] = None
    eval_score: Optional[EvalScore] = None
    confidence_flag: Optional[str] = None
    request_id: Optional[str] = None


@dataclass
class CostBreakdown:
    """Itemised cost estimate for a single model."""

    model_name: str
    provider: str
    role: str
    monthly_cost_usd: float
    cost_per_request_usd: float
    pricing_source: str


@dataclass
class LatencyBreakdown:
    """Latency estimate for a single pipeline step."""

    step: str
    p50_ms: int
    p95_ms: int
    source: str


@dataclass
class EstimateResult:
    """Response from POST /v1/estimate."""

    total_monthly_cost_usd: float
    total_p95_latency_ms: int
    cost_breakdown: List[CostBreakdown]
    latency_breakdown: List[LatencyBreakdown]
    benchmark_citations: List[BenchmarkCitation]
    monthly_request_volume: int
    request_id: Optional[str] = None


@dataclass
class ExplainResult:
    """Response from POST /v1/explain."""

    blueprint_id: str
    explanation: str
    tradeoffs: List[Dict[str, Any]] = field(default_factory=list)
    alternatives_considered: List[Dict[str, Any]] = field(default_factory=list)
    request_id: Optional[str] = None


@dataclass
class ModelEntry:
    """A single model in the registry."""

    id: str
    provider: str
    model_name: str
    capabilities: List[str]
    pricing: Dict[str, Any]
    pricing_source: str
    is_active: bool
    model_version: Optional[str] = None
    latency_p50_ms: Optional[int] = None
    latency_p95_ms: Optional[int] = None
    latency_source: Optional[str] = None
    quality_scores: Optional[Dict[str, Any]] = None
    quality_source: Optional[str] = None
    pricing_fetched_at: Optional[str] = None


@dataclass
class ModelsResult:
    """Response from GET /v1/models."""

    models: List[ModelEntry]
    total: int
    cache_ttl_seconds: int
    request_id: Optional[str] = None
