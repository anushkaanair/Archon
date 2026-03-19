"""Sentence-transformer embedding wrapper.

Provides a lazy-loaded singleton for encoding text into dense vectors.
Uses ``all-MiniLM-L6-v2`` by default (384-dimensional, fast, production-grade).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

from app.config import get_settings

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer


_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the sentence transformer model.

    This avoids loading the model at import time, which would slow down
    startup and waste memory if the model isn't needed (e.g. health checks).
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        settings = get_settings()
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_texts(texts: list[str]) -> np.ndarray:
    """Encode a list of texts into dense vectors.

    Args:
        texts: List of strings to embed.

    Returns:
        numpy array of shape ``(len(texts), dim)`` where ``dim`` is the
        model's embedding dimension (384 for MiniLM-L6-v2).
    """
    model = _get_model()
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)


def embed_query(text: str) -> list[float]:
    """Encode a single query string into a dense vector.

    Returns a plain Python list (not numpy) for JSON serialisation and
    Qdrant compatibility.
    """
    vectors = embed_texts([text])
    return vectors[0].tolist()


def get_embedding_dim() -> int:
    """Return the dimensionality of the embedding model.

    Useful for setting up the Qdrant collection schema.
    """
    model = _get_model()
    return model.get_sentence_embedding_dimension()
