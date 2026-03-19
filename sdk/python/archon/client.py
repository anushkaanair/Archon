"""Synchronous Archon client.

Every public method has a docstring, type hints, and a usage example.
Rate limit errors (429) trigger automatic exponential backoff with
jitter — max 3 retries. API keys are NEVER exposed in logs or errors.

Usage::

    from archon import ArchonClient

    client = ArchonClient(api_key="arch_xxx")
    result = client.analyze("A legal Q&A bot with citation tracking")
    for task in result.detected_tasks:
        print(f"{task.task}: {task.confidence:.2f}")
"""

from __future__ import annotations

import random
import time
from typing import Any, Dict, List, Optional

import httpx

from archon.exceptions import (
    ArchonAuthError,
    ArchonError,
    ArchonRateLimitError,
    ArchonServerError,
    ArchonValidationError,
)
from archon.models import (
    AnalyzeResult,
    ArchitectResult,
    DetectedTask,
    EstimateResult,
    ExplainResult,
    ModelEntry,
    ModelRecommendation,
    ModelScore,
    ModelsResult,
    RecommendResult,
    BenchmarkCitation,
    CostBreakdown,
    LatencyBreakdown,
    EvalScore,
)

_DEFAULT_BASE_URL = "https://api.archon.dev"
_MAX_RETRIES = 3


class ArchonClient:
    """Synchronous client for the Archon API.

    Args:
        api_key: Your Archon API key. Never logged or included in error messages.
        base_url: API base URL (default: https://api.archon.dev).
        timeout: Request timeout in seconds (default: 60).

    Example::

        client = ArchonClient(api_key="arch_xxx")
        result = client.architect("An AI-powered code review tool")
        print(result.architecture_diagram)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
        timeout: int = 60,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        # API key is stored privately and never exposed
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def analyze(self, input_text: str) -> AnalyzeResult:
        """Detect AI tasks from a natural-language product idea.

        Args:
            input_text: Product idea (10–5000 characters).

        Returns:
            AnalyzeResult with detected tasks and confidence scores.

        Example::

            result = client.analyze("A chatbot for customer support with RAG")
            for task in result.detected_tasks:
                print(f"{task.task}: {task.confidence}")
        """
        data = self._request("POST", "/v1/analyze", json={"input_text": input_text})
        return AnalyzeResult(
            input_text=data["input_text"],
            detected_tasks=[DetectedTask(**t) for t in data["detected_tasks"]],
            query_id=data["query_id"],
            request_id=data.get("request_id"),
        )

    def recommend(
        self,
        query_id: str,
        detected_tasks: List[Dict[str, Any]],
        budget_monthly_usd: Optional[float] = None,
        prefer_open_source: bool = False,
    ) -> RecommendResult:
        """Get model recommendations for detected AI tasks.

        Args:
            query_id: UUID from a previous /v1/analyze call.
            detected_tasks: List of task dicts with 'task' and 'confidence'.
            budget_monthly_usd: Optional budget cap in USD.
            prefer_open_source: Boost open-source model rankings.

        Returns:
            RecommendResult with ranked model recommendations.

        Example::

            result = client.recommend(
                query_id="abc-123",
                detected_tasks=[{"task": "rag", "confidence": 0.95}],
            )
            print(result.recommendations[0].model_name)
        """
        body: Dict[str, Any] = {
            "query_id": query_id,
            "detected_tasks": detected_tasks,
            "prefer_open_source": prefer_open_source,
        }
        if budget_monthly_usd is not None:
            body["budget_monthly_usd"] = budget_monthly_usd

        data = self._request("POST", "/v1/recommend", json=body)
        return RecommendResult(
            query_id=data["query_id"],
            recommendations=[
                ModelRecommendation(
                    provider=r["provider"],
                    model_name=r["model_name"],
                    task=r["task"],
                    scores=ModelScore(**r["scores"]),
                    pricing=r.get("pricing", {}),
                    pricing_source=r.get("pricing_source", ""),
                    rationale=r.get("rationale", ""),
                )
                for r in data.get("recommendations", [])
            ],
            total_estimated_monthly_cost=data.get("total_estimated_monthly_cost"),
            request_id=data.get("request_id"),
        )

    def architect(
        self,
        input_text: str,
        async_mode: bool = False,
    ) -> ArchitectResult:
        """Generate a complete AI architecture blueprint.

        Args:
            input_text: Product idea (10–5000 characters).
            async_mode: If True, returns a job ID for polling.

        Returns:
            ArchitectResult with full blueprint or job ID.

        Example::

            result = client.architect("An AI code review tool")
            print(result.architecture_diagram)
            print(f"Monthly cost: ${result.cost_estimate}")
        """
        data = self._request("POST", "/v1/architect", json={
            "input_text": input_text,
            "async_mode": async_mode,
        })
        return ArchitectResult(
            status=data["status"],
            blueprint_id=data.get("blueprint_id"),
            job_id=data.get("job_id"),
            input_text=data.get("input_text"),
            architecture_json=data.get("architecture_json"),
            architecture_diagram=data.get("architecture_diagram"),
            cost_estimate=data.get("cost_estimate"),
            latency_estimate=data.get("latency_estimate"),
            explanation=data.get("explanation"),
            confidence_flag=data.get("confidence_flag"),
            request_id=data.get("request_id"),
        )

    def estimate(
        self,
        blueprint_id: Optional[str] = None,
        architecture_json: Optional[Dict] = None,
        monthly_request_volume: int = 10000,
        avg_input_tokens: int = 500,
        avg_output_tokens: int = 1000,
    ) -> EstimateResult:
        """Estimate cost and latency for an architecture.

        Args:
            blueprint_id: UUID of an existing blueprint.
            architecture_json: Raw architecture JSON.
            monthly_request_volume: Estimated monthly requests.
            avg_input_tokens: Average input tokens per request.
            avg_output_tokens: Average output tokens per request.

        Returns:
            EstimateResult with cost/latency breakdowns and citations.

        Example::

            result = client.estimate(blueprint_id="abc-123")
            print(f"Monthly cost: ${result.total_monthly_cost_usd:.2f}")
            print(f"P95 latency: {result.total_p95_latency_ms}ms")
        """
        body: Dict[str, Any] = {
            "monthly_request_volume": monthly_request_volume,
            "avg_input_tokens": avg_input_tokens,
            "avg_output_tokens": avg_output_tokens,
        }
        if blueprint_id:
            body["blueprint_id"] = blueprint_id
        if architecture_json:
            body["architecture_json"] = architecture_json

        data = self._request("POST", "/v1/estimate", json=body)
        return EstimateResult(
            total_monthly_cost_usd=data["total_monthly_cost_usd"],
            total_p95_latency_ms=data["total_p95_latency_ms"],
            cost_breakdown=[CostBreakdown(**c) for c in data.get("cost_breakdown", [])],
            latency_breakdown=[LatencyBreakdown(**l) for l in data.get("latency_breakdown", [])],
            benchmark_citations=[BenchmarkCitation(**c) for c in data.get("benchmark_citations", [])],
            monthly_request_volume=data["monthly_request_volume"],
            request_id=data.get("request_id"),
        )

    def explain(self, blueprint_id: str) -> ExplainResult:
        """Get a plain-English explanation of a blueprint.

        Args:
            blueprint_id: UUID of the blueprint to explain.

        Returns:
            ExplainResult with explanation, tradeoffs, and alternatives.

        Example::

            result = client.explain(blueprint_id="abc-123")
            print(result.explanation)
        """
        data = self._request("POST", "/v1/explain", json={"blueprint_id": blueprint_id})
        return ExplainResult(
            blueprint_id=data["blueprint_id"],
            explanation=data["explanation"],
            tradeoffs=data.get("tradeoffs", []),
            alternatives_considered=data.get("alternatives_considered", []),
            request_id=data.get("request_id"),
        )

    def list_models(self) -> ModelsResult:
        """List all models in the registry.

        Returns:
            ModelsResult with model entries and cache TTL.

        Example::

            result = client.list_models()
            for model in result.models:
                print(f"{model.provider}/{model.model_name}")
        """
        data = self._request("GET", "/v1/models")
        return ModelsResult(
            models=[ModelEntry(**m) for m in data.get("models", [])],
            total=data["total"],
            cache_ttl_seconds=data["cache_ttl_seconds"],
            request_id=data.get("request_id"),
        )

    def _request(
        self,
        method: str,
        path: str,
        json: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Make an HTTP request with exponential backoff on rate limits.

        Rate limit errors (429) trigger automatic retry with exponential
        backoff + jitter — max 3 retries. API keys are NEVER logged.
        """
        url = f"{self._base_url}{path}"

        for attempt in range(_MAX_RETRIES + 1):
            try:
                with httpx.Client(timeout=self._timeout) as http:
                    response = http.request(
                        method=method,
                        url=url,
                        json=json,
                        headers=self._headers,
                    )
            except httpx.TimeoutException:
                if attempt < _MAX_RETRIES:
                    self._backoff(attempt)
                    continue
                raise ArchonError("Request timed out.", status_code=408)
            except httpx.RequestError as e:
                raise ArchonError(f"Connection error: {e}", status_code=None)

            if response.status_code == 429:
                if attempt < _MAX_RETRIES:
                    retry_after = int(response.headers.get("Retry-After", "5"))
                    self._backoff(attempt, retry_after)
                    continue
                raise ArchonRateLimitError(
                    retry_after=int(response.headers.get("Retry-After", "60")),
                    request_id=response.headers.get("X-Request-ID"),
                )

            return self._handle_response(response)

        raise ArchonError("Max retries exceeded.")

    def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        """Parse response and raise typed exceptions on errors."""
        request_id = response.headers.get("X-Request-ID")

        if response.status_code == 401:
            raise ArchonAuthError(request_id=request_id)
        if response.status_code == 422:
            detail = response.json().get("detail", "Validation error")
            raise ArchonValidationError(str(detail), request_id=request_id)
        if response.status_code >= 500:
            raise ArchonServerError(request_id=request_id)
        if response.status_code >= 400:
            msg = response.json().get("message", "API error")
            raise ArchonError(msg, status_code=response.status_code, request_id=request_id)

        return response.json()

    @staticmethod
    def _backoff(attempt: int, base: int = 1) -> None:
        """Exponential backoff with jitter."""
        delay = base * (2 ** attempt) + random.uniform(0, 1)
        time.sleep(delay)
