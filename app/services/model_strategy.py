"""Model strategy service.

For each detected AI task, queries the model registry, computes a weighted
composite score (cost 0.25, latency 0.25, quality 0.30, task_fit 0.20),
and returns a ranked recommendation list.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.common import ModelRecommendation, ModelScore
from app.services.model_registry_service import get_models_for_task


# ── Score weights (project spec) ─────────────────────────────────
COST_WEIGHT = 0.25
LATENCY_WEIGHT = 0.25
QUALITY_WEIGHT = 0.30
TASK_FIT_WEIGHT = 0.20


def _normalise(values: list[float], invert: bool = False) -> list[float]:
    """Min-max normalise a list of values to [0, 1].

    If ``invert`` is True, lower raw values get higher normalised scores
    (used for cost and latency where lower is better).
    """
    if not values:
        return []
    mn, mx = min(values), max(values)
    if mn == mx:
        return [1.0] * len(values)
    normalised = [(v - mn) / (mx - mn) for v in values]
    if invert:
        normalised = [1.0 - v for v in normalised]
    return normalised


def _compute_task_fit(model_capabilities: list[str], task: str) -> float:
    """Score how well a model fits a specific task.

    Returns 1.0 if the task is explicitly in the model's capabilities,
    0.5 if a related task is present, 0.2 otherwise.
    """
    if task in model_capabilities:
        return 1.0

    # Related task mapping for partial matches
    related: dict[str, list[str]] = {
        "rag": ["search", "chatbot", "summarisation"],
        "chatbot": ["rag", "agent"],
        "code_generation": ["agent"],
        "agent": ["code_generation", "chatbot"],
        "search": ["rag"],
        "summarisation": ["rag", "chatbot"],
    }

    task_related = related.get(task, [])
    if any(r in model_capabilities for r in task_related):
        return 0.5

    return 0.2


async def recommend_models(
    detected_tasks: list[dict],
    db: AsyncSession,
    redis_client: Any | None = None,
    budget_monthly_usd: float | None = None,
    prefer_open_source: bool = False,
) -> list[ModelRecommendation]:
    """Generate ranked model recommendations for each detected AI task.

    For each task:
    1. Fetch models with matching capabilities from the registry
    2. Score each model on cost, latency, quality, and task fit
    3. Compute weighted composite score
    4. Return ranked recommendations

    Args:
        detected_tasks: List of dicts with ``task`` and ``confidence`` keys.
        db: Async SQLAlchemy session.
        redis_client: Optional Redis client for model registry cache.
        budget_monthly_usd: Optional budget filter.
        prefer_open_source: Boost open-source model scores.

    Returns:
        List of ``ModelRecommendation`` sorted by composite score.
    """
    all_recommendations: list[ModelRecommendation] = []

    for task_info in detected_tasks:
        task = task_info["task"] if isinstance(task_info, dict) else task_info.task

        models = await get_models_for_task(task, db, redis_client)

        if not models:
            continue

        # Extract raw scores for normalisation
        costs = []
        latencies = []
        qualities = []
        fits = []

        for m in models:
            # Cost: use input price as proxy
            price = m.get("pricing", {})
            cost = price.get("input_per_1m_tokens", 0) + price.get("output_per_1m_tokens", 0)
            costs.append(cost)

            # Latency: use p95, fallback to 1000ms
            latencies.append(m.get("latency_p95_ms") or 1000)

            # Quality: use arena_elo as primary, fallback to mmlu
            qs = m.get("quality_scores") or {}
            quality = qs.get("arena_elo", qs.get("mmlu", 50)) / 100  # Normalise roughly
            qualities.append(quality)

            # Task fit
            fits.append(_compute_task_fit(m.get("capabilities", []), task))

        # Normalise (invert cost and latency — lower is better)
        norm_costs = _normalise(costs, invert=True)
        norm_latencies = _normalise(latencies, invert=True)
        norm_qualities = _normalise(qualities, invert=False)
        norm_fits = _normalise(fits, invert=False)

        for i, m in enumerate(models):
            composite = (
                COST_WEIGHT * norm_costs[i]
                + LATENCY_WEIGHT * norm_latencies[i]
                + QUALITY_WEIGHT * norm_qualities[i]
                + TASK_FIT_WEIGHT * norm_fits[i]
            )

            # Boost open-source if preferred
            if prefer_open_source and m.get("provider") == "open_source":
                composite = min(composite * 1.15, 1.0)

            scores = ModelScore(
                cost_score=round(norm_costs[i], 4),
                latency_score=round(norm_latencies[i], 4),
                quality_score=round(norm_qualities[i], 4),
                task_fit_score=round(norm_fits[i], 4),
                composite=round(composite, 4),
            )

            rec = ModelRecommendation(
                provider=m["provider"],
                model_name=m["model_name"],
                task=task,
                scores=scores,
                pricing=m.get("pricing", {}),
                pricing_source=m.get("pricing_source", ""),
                rationale=f"{m['model_name']} scored {composite:.2f} for {task} "
                          f"(cost: {norm_costs[i]:.2f}, latency: {norm_latencies[i]:.2f}, "
                          f"quality: {norm_qualities[i]:.2f}, fit: {norm_fits[i]:.2f})",
            )

            # Budget filter
            if budget_monthly_usd is not None:
                price = m.get("pricing", {})
                estimated_monthly = (
                    price.get("input_per_1m_tokens", 0) * 10  # ~10M tokens/month baseline
                    + price.get("output_per_1m_tokens", 0) * 5
                )
                if estimated_monthly > budget_monthly_usd:
                    continue

            all_recommendations.append(rec)

    # Sort all recommendations by composite score
    all_recommendations.sort(key=lambda r: r.scores.composite, reverse=True)

    return all_recommendations
