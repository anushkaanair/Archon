"""BM25 sparse index for hybrid retrieval.

Maintains an in-memory BM25 index over the chunked knowledge base.
This provides the sparse retrieval leg of the hybrid search (dense + BM25).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from rank_bm25 import BM25Okapi


@dataclass
class BM25Index:
    """In-memory BM25 index over text chunks.

    Stores tokenised documents and maps BM25 scores back to chunk IDs.
    """

    _corpus_tokens: list[list[str]] = field(default_factory=list)
    _chunk_ids: list[str] = field(default_factory=list)
    _bm25: BM25Okapi | None = None

    def add_documents(self, chunk_ids: list[str], texts: list[str]) -> None:
        """Add documents to the index.

        Args:
            chunk_ids: Unique identifiers for each chunk (matching Qdrant point IDs).
            texts: The raw text of each chunk.
        """
        tokenised = [self._tokenise(t) for t in texts]
        self._corpus_tokens.extend(tokenised)
        self._chunk_ids.extend(chunk_ids)
        self._rebuild()

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float]]:
        """Search the BM25 index and return ranked chunk IDs with scores.

        Args:
            query: Raw query text.
            top_k: Maximum number of results.

        Returns:
            List of ``(chunk_id, score)`` tuples sorted by score descending.
        """
        if self._bm25 is None or not self._chunk_ids:
            return []

        tokens = self._tokenise(query)
        scores = self._bm25.get_scores(tokens)

        scored = sorted(
            zip(self._chunk_ids, scores),
            key=lambda x: x[1],
            reverse=True,
        )

        return scored[:top_k]

    def _rebuild(self) -> None:
        """Rebuild the BM25 model from the current corpus."""
        if self._corpus_tokens:
            self._bm25 = BM25Okapi(self._corpus_tokens)
        else:
            self._bm25 = None

    @staticmethod
    def _tokenise(text: str) -> list[str]:
        """Simple whitespace + lowercase tokenisation.

        Strips punctuation and lowercases for consistent matching.
        """
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        return [w for w in text.split() if len(w) > 1]
