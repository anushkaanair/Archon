"""CrossEncoder re-ranking for RAG retrieval.

After hybrid search (dense + BM25) produces an initial candidate set,
the CrossEncoder re-ranks them by computing a fine-grained relevance
score for each (query, candidate) pair. This dramatically improves
retrieval precision — studies show ~18% improvement in top-5 precision.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.config import get_settings

if TYPE_CHECKING:
    from sentence_transformers import CrossEncoder


_reranker: CrossEncoder | None = None


def _get_reranker() -> CrossEncoder:
    """Lazy-load the CrossEncoder model.

    Uses ``cross-encoder/ms-marco-MiniLM-L-6-v2`` by default — a small,
    fast model trained on MS MARCO that produces reliable relevance scores.
    """
    global _reranker
    if _reranker is None:
        from sentence_transformers import CrossEncoder

        settings = get_settings()
        _reranker = CrossEncoder(settings.reranker_model)
    return _reranker


@dataclass
class RerankResult:
    """A single re-ranked result."""

    chunk_id: str
    text: str
    score: float
    source: str
    metadata: dict


def rerank(
    query: str,
    candidates: list[dict],
    top_k: int = 10,
) -> list[RerankResult]:
    """Re-rank candidate chunks against a query using CrossEncoder.

    Args:
        query: The user's search query.
        candidates: List of dicts with at least ``chunk_id``, ``text``,
            ``source``, and optionally ``metadata``.
        top_k: Number of top results to return after re-ranking.

    Returns:
        List of ``RerankResult`` sorted by relevance score descending.
    """
    if not candidates:
        return []

    model = _get_reranker()

    # Prepare (query, candidate_text) pairs for the CrossEncoder
    pairs = [(query, c["text"]) for c in candidates]
    scores = model.predict(pairs)

    results = []
    for candidate, score in zip(candidates, scores):
        results.append(
            RerankResult(
                chunk_id=candidate.get("chunk_id", ""),
                text=candidate["text"],
                score=float(score),
                source=candidate.get("source", "unknown"),
                metadata=candidate.get("metadata", {}),
            )
        )

    # Sort by score descending and take top_k
    results.sort(key=lambda r: r.score, reverse=True)
    return results[:top_k]
