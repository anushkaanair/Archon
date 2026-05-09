"""Reciprocal Rank Fusion (RRF) re-ranking.

Replaces CrossEncoder — no neural model, no torch, no GPU needed.
RRF combines dense-vector ranks and BM25 ranks into a single ordering
using the formula: score = Σ 1 / (k + rank_i), where k=60.

Studies show RRF matches or beats learned re-rankers on most benchmarks
while being orders of magnitude cheaper to run.
"""

from __future__ import annotations

from dataclasses import dataclass

_RRF_K = 60  # Standard constant from the original RRF paper (Cormack 2009)


@dataclass
class RerankResult:
    """A single re-ranked retrieval result."""

    chunk_id: str
    text: str
    score: float
    source: str
    metadata: dict


def rerank(
    query: str,  # kept for API compatibility — not used by RRF
    candidates: list[dict],
    top_k: int = 10,
) -> list[RerankResult]:
    """Re-rank candidates using Reciprocal Rank Fusion.

    Each candidate dict must contain:
        - chunk_id (str)
        - text (str)
        - source (str)
        - dense_rank (int) — 1-based rank from cosine similarity
        - sparse_rank (int) — 1-based rank from BM25
        - metadata (dict, optional)

    If ``dense_rank`` / ``sparse_rank`` are absent, ``combined_score`` is
    used directly as the RRF score (for callers that pre-compute scores).

    Args:
        query: Original query string (unused, retained for API compat).
        candidates: List of candidate dicts as described above.
        top_k: Number of top results to return.

    Returns:
        List of ``RerankResult`` sorted by RRF score descending.
    """
    if not candidates:
        return []

    results = []
    for c in candidates:
        dense_rank = c.get("dense_rank")
        sparse_rank = c.get("sparse_rank")

        if dense_rank is not None and sparse_rank is not None:
            rrf_score = (1.0 / (_RRF_K + dense_rank)) + (1.0 / (_RRF_K + sparse_rank))
        else:
            # Fall back to combined_score if ranks aren't provided
            rrf_score = c.get("combined_score", 0.0)

        results.append(
            RerankResult(
                chunk_id=c.get("chunk_id", ""),
                text=c.get("text", ""),
                score=rrf_score,
                source=c.get("source", "unknown"),
                metadata=c.get("metadata", {}),
            )
        )

    results.sort(key=lambda r: r.score, reverse=True)
    return results[:top_k]
