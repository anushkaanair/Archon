"""Knowledge base management — ingest and query.

Handles document ingestion (chunk → embed → upsert to Qdrant + BM25)
and the full hybrid retrieval pipeline (dense + BM25 → merge → CrossEncoder).
"""

from __future__ import annotations

import uuid
from typing import Any

from app.config import get_settings
from app.rag.bm25_index import BM25Index
from app.rag.chunker import Chunk, chunk_text
from app.rag.embedder import embed_query, embed_texts, get_embedding_dim
from app.rag.reranker import RerankResult, rerank

# Module-level BM25 index (loaded into memory once)
_bm25_index = BM25Index()


async def ingest_document(
    qdrant_client: Any,
    text: str,
    source: str,
    metadata: dict | None = None,
) -> int:
    """Ingest a document into the knowledge base.

    Pipeline: text → chunk → embed → upsert to Qdrant + BM25.

    Args:
        qdrant_client: Async Qdrant client.
        text: Full document text.
        source: Source identifier (URL, filename).
        metadata: Optional extra metadata to attach to each chunk.

    Returns:
        Number of chunks ingested.
    """
    settings = get_settings()
    chunks = chunk_text(text, source=source)

    if not chunks:
        return 0

    # Generate embeddings for all chunks
    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)

    # Generate chunk IDs
    chunk_ids = [str(uuid.uuid4()) for _ in chunks]

    # Upsert to Qdrant
    from qdrant_client.models import PointStruct

    points = [
        PointStruct(
            id=cid,
            vector=emb.tolist(),
            payload={
                **chunk.to_dict(),
                **(metadata or {}),
            },
        )
        for cid, emb, chunk in zip(chunk_ids, embeddings, chunks)
    ]

    await qdrant_client.upsert(
        collection_name=settings.qdrant_collection,
        points=points,
    )

    # Add to BM25 index
    _bm25_index.add_documents(chunk_ids, texts)

    return len(chunks)


async def hybrid_search(
    qdrant_client: Any,
    query: str,
    top_k: int = 10,
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4,
) -> list[RerankResult]:
    """Execute a hybrid search: dense (Qdrant) + sparse (BM25) → re-rank.

    This is the core retrieval function. It MUST always be called before
    any LLM reasoning — per project rules, retrieval is never skipped.

    Args:
        qdrant_client: Async Qdrant client.
        query: Natural-language search query.
        top_k: Number of final results after re-ranking.
        dense_weight: Weight for dense search scores (0.0–1.0).
        sparse_weight: Weight for BM25 scores (0.0–1.0).

    Returns:
        List of ``RerankResult`` after CrossEncoder re-ranking,
        sorted by relevance score descending.
    """
    settings = get_settings()

    # ── 1. Dense search via Qdrant ──────────────────────────────
    query_vector = embed_query(query)

    dense_results = await qdrant_client.search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        limit=top_k * 3,  # Over-fetch for merging
    )

    dense_candidates: dict[str, dict] = {}
    for hit in dense_results:
        cid = str(hit.id)
        dense_candidates[cid] = {
            "chunk_id": cid,
            "text": hit.payload.get("text", ""),
            "source": hit.payload.get("source", "unknown"),
            "metadata": hit.payload,
            "dense_score": hit.score,
            "sparse_score": 0.0,
        }

    # ── 2. Sparse search via BM25 ──────────────────────────────
    bm25_results = _bm25_index.search(query, top_k=top_k * 3)

    for cid, score in bm25_results:
        if cid in dense_candidates:
            dense_candidates[cid]["sparse_score"] = score
        else:
            # BM25-only hit — we don't have the full payload, so mark it
            dense_candidates[cid] = {
                "chunk_id": cid,
                "text": "",  # Will need to be fetched if needed
                "source": "unknown",
                "metadata": {},
                "dense_score": 0.0,
                "sparse_score": score,
            }

    # ── 3. Merge scores ─────────────────────────────────────────
    # Normalise scores to [0, 1] range before weighting
    if dense_candidates:
        max_dense = max(c["dense_score"] for c in dense_candidates.values()) or 1.0
        max_sparse = max(c["sparse_score"] for c in dense_candidates.values()) or 1.0

        for c in dense_candidates.values():
            c["combined_score"] = (
                dense_weight * (c["dense_score"] / max_dense)
                + sparse_weight * (c["sparse_score"] / max_sparse)
            )

    # Sort by combined score and take top candidates for re-ranking
    sorted_candidates = sorted(
        dense_candidates.values(),
        key=lambda c: c.get("combined_score", 0),
        reverse=True,
    )[: top_k * 2]

    # Filter out candidates with empty text (BM25-only hits without payload)
    valid_candidates = [c for c in sorted_candidates if c["text"]]

    # ── 4. CrossEncoder re-rank ─────────────────────────────────
    if not valid_candidates:
        return []

    reranked = rerank(query, valid_candidates, top_k=top_k)

    return reranked


def get_retrieval_confidence(results: list[RerankResult]) -> float:
    """Compute a confidence score for the retrieval quality.

    Uses the top result's CrossEncoder score normalised to [0, 1].
    A score below 0.3 indicates weak retrieval and should trigger a
    low-confidence flag.

    Args:
        results: Re-ranked results from ``hybrid_search``.

    Returns:
        Confidence score between 0.0 and 1.0.
    """
    if not results:
        return 0.0

    # CrossEncoder scores are typically in [-10, 10] range for ms-marco
    top_score = results[0].score

    # Sigmoid normalisation to [0, 1]
    import math
    confidence = 1.0 / (1.0 + math.exp(-top_score))

    return round(confidence, 4)
