"""Knowledge base management — ingest and query via pgvector.

Handles document ingestion (chunk → embed → store in PostgreSQL + BM25)
and the full hybrid retrieval pipeline (dense pgvector + BM25 → RRF merge).

No Qdrant, no torch, no model downloads. Requires PostgreSQL with pgvector.
"""

from __future__ import annotations

import math
import uuid
from typing import Any

from app.rag.bm25_index import BM25Index
from app.rag.chunker import chunk_text
from app.rag.embedder import embed_query, embed_texts
from app.rag.reranker import RerankResult, rerank

# Module-level BM25 index (in-memory, rebuilt from DB on cold start if needed)
_bm25_index = BM25Index()


async def ingest_document(
    db: Any,  # SQLAlchemy AsyncSession
    text: str,
    source: str,
    metadata: dict | None = None,
) -> int:
    """Ingest a document into the knowledge base.

    Pipeline: text → chunk → embed (Google) → store in knowledge_chunks +
    BM25 index.

    Args:
        db: SQLAlchemy async session.
        text: Full document text.
        source: Source identifier (URL, filename, etc.).
        metadata: Optional extra metadata to attach to each chunk.

    Returns:
        Number of chunks ingested, or 0 on error.
    """
    try:
        from app.db.models.knowledge_chunk import KnowledgeChunk
    except Exception:
        return 0  # pgvector not available

    chunks = chunk_text(text, source=source)
    if not chunks:
        return 0

    texts = [c.text for c in chunks]
    embeddings = await embed_texts(texts)  # shape (n, 768)

    chunk_ids: list[str] = []
    for chunk, emb in zip(chunks, embeddings):
        cid = str(uuid.uuid4())
        chunk_ids.append(cid)

        row = KnowledgeChunk(
            chunk_id=cid,
            text=chunk.text,
            source=source,
            chunk_metadata={**(chunk.to_dict() if hasattr(chunk, "to_dict") else {}), **(metadata or {})},
            embedding=emb.tolist(),
        )
        db.add(row)

    await db.flush()

    # Update the in-memory BM25 index
    _bm25_index.add_documents(chunk_ids, texts)

    return len(chunks)


async def hybrid_search(
    db: Any,  # SQLAlchemy AsyncSession
    query: str,
    top_k: int = 10,
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4,
) -> list[RerankResult]:
    """Execute hybrid search: dense (pgvector cosine) + sparse (BM25) → RRF.

    Args:
        db: SQLAlchemy async session.
        query: Natural-language search query.
        top_k: Number of final results after RRF re-ranking.
        dense_weight: Unused (kept for API compat). RRF weights ranks equally.
        sparse_weight: Unused (kept for API compat).

    Returns:
        List of ``RerankResult`` sorted by RRF score descending.
    """
    try:
        from app.db.models.knowledge_chunk import KnowledgeChunk, _HAVE_PGVECTOR
        from sqlalchemy import select, text as sa_text
    except Exception:
        return []

    candidates: dict[str, dict] = {}

    # ── 1. Dense search via pgvector ────────────────────────────
    if _HAVE_PGVECTOR:
        try:
            query_vec = await embed_query(query)
            # Use pgvector's <=> (cosine distance) operator via raw SQL
            # (SQLAlchemy ORM doesn't auto-generate this without extra setup)
            stmt = sa_text(
                """
                SELECT chunk_id, text, source, metadata,
                       1 - (embedding <=> CAST(:vec AS vector)) AS cosine_sim
                FROM knowledge_chunks
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT :limit
                """
            ).bindparams(vec=str(query_vec), limit=top_k * 3)

            result = await db.execute(stmt)
            rows = result.fetchall()

            for rank, row in enumerate(rows, start=1):
                cid = row.chunk_id
                candidates[cid] = {
                    "chunk_id": cid,
                    "text": row.text,
                    "source": row.source,
                    "metadata": row.metadata or {},
                    "dense_rank": rank,
                    "sparse_rank": top_k * 3 + 1,  # default worst rank
                }
        except Exception:
            pass  # pgvector not installed/enabled — BM25 only

    # ── 2. Sparse search via BM25 ────────────────────────────────
    bm25_results = _bm25_index.search(query, top_k=top_k * 3)

    for rank, (cid, _score) in enumerate(bm25_results, start=1):
        if cid in candidates:
            candidates[cid]["sparse_rank"] = rank
        else:
            # BM25-only hit — fetch text from DB
            try:
                stmt = (
                    select(
                        KnowledgeChunk.chunk_id,
                        KnowledgeChunk.text,
                        KnowledgeChunk.source,
                        KnowledgeChunk.chunk_metadata,
                    ).where(KnowledgeChunk.chunk_id == cid)
                )
                row = (await db.execute(stmt)).one_or_none()
                if row:
                    candidates[cid] = {
                        "chunk_id": row.chunk_id,
                        "text": row.text,
                        "source": row.source,
                        "metadata": row.chunk_metadata or {},
                        "dense_rank": top_k * 3 + 1,
                        "sparse_rank": rank,
                    }
            except Exception:
                pass

    if not candidates:
        return []

    # ── 3. RRF re-rank ───────────────────────────────────────────
    valid = [c for c in candidates.values() if c.get("text")]
    reranked = rerank(query, valid, top_k=top_k)
    return reranked


def get_retrieval_confidence(results: list[RerankResult]) -> float:
    """Compute a simple confidence score from RRF result scores.

    RRF scores are small positive floats (e.g. 0.015 for rank 1 with k=60).
    We normalise against the theoretical maximum (rank 1 from both lists).

    Returns:
        Confidence score in [0.0, 1.0].
    """
    if not results:
        return 0.0

    max_rrf = (1.0 / (60 + 1)) + (1.0 / (60 + 1))  # both lists rank 1
    confidence = min(results[0].score / max_rrf, 1.0)
    return round(confidence, 4)
