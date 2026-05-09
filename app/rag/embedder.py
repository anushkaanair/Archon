"""Google text-embedding-004 embeddings client.

Replaces local sentence-transformers — no torch, no model download.
Free tier: 1,500 RPM, 768-dimensional output.
"""

from __future__ import annotations

import asyncio

import numpy as np


_EMBEDDING_MODEL = "models/text-embedding-004"
_DIM = 768


def _embed_sync(texts: list[str], task_type: str) -> np.ndarray:
    """Synchronous embedding call (wraps the Google genai SDK).

    google.generativeai is not async-native, so this function is always
    called via ``asyncio.to_thread`` to avoid blocking the event loop.
    """
    import google.generativeai as genai

    from app.config import get_settings

    settings = get_settings()
    genai.configure(api_key=settings.google_api_key)

    result = genai.embed_content(
        model=_EMBEDDING_MODEL,
        content=texts,
        task_type=task_type,
    )

    # embed_content returns {"embedding": [...]} for a single string or
    # {"embedding": [[...], [...]]} for a list — normalise to 2-D.
    raw = result["embedding"]
    if raw and not isinstance(raw[0], list):
        raw = [raw]  # single text — wrap to 2-D

    vecs = np.array(raw, dtype=np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    return vecs / np.where(norms == 0, 1, norms)


async def embed_texts(texts: list[str]) -> np.ndarray:
    """Embed a batch of document texts for indexing.

    Returns:
        Float32 array of shape ``(len(texts), 768)``, L2-normalised.
    """
    return await asyncio.to_thread(_embed_sync, texts, "retrieval_document")


async def embed_query(text: str) -> list[float]:
    """Embed a single search query.

    Returns:
        L2-normalised float list of length 768.
    """
    arr = await asyncio.to_thread(_embed_sync, [text], "retrieval_query")
    return arr[0].tolist()


def get_embedding_dim() -> int:
    """Return the embedding dimension (768 for text-embedding-004)."""
    return _DIM
