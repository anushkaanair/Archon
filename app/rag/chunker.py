"""Document chunking strategy.

Splits long documents into overlapping chunks suitable for embedding and
retrieval. Default configuration: 512-token chunks with 50-token overlap
(configured in ``app.config``).
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.config import get_settings


@dataclass
class Chunk:
    """A single text chunk with its source metadata."""

    text: str
    source: str
    chunk_index: int
    start_char: int
    end_char: int

    def to_dict(self) -> dict:
        """Serialise the chunk for storage in Qdrant payload."""
        return {
            "text": self.text,
            "source": self.source,
            "chunk_index": self.chunk_index,
            "start_char": self.start_char,
            "end_char": self.end_char,
        }


def chunk_text(
    text: str,
    source: str = "unknown",
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[Chunk]:
    """Split text into overlapping chunks by approximate token count.

    Uses a simple whitespace-based tokenisation (word count ≈ 0.75× token
    count) which is good enough for chunking purposes without requiring a
    tokeniser dependency.

    Args:
        text: The full document text to chunk.
        source: Source identifier (e.g. filename or URL) for provenance.
        chunk_size: Number of approximate tokens per chunk. Defaults to config.
        chunk_overlap: Number of overlapping tokens between chunks. Defaults to config.

    Returns:
        List of ``Chunk`` objects with source metadata.
    """
    settings = get_settings()
    size = chunk_size or settings.chunk_size
    overlap = chunk_overlap or settings.chunk_overlap

    # Normalise whitespace
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()

    if not words:
        return []

    chunks: list[Chunk] = []
    idx = 0
    chunk_num = 0

    while idx < len(words):
        end_idx = min(idx + size, len(words))
        chunk_words = words[idx:end_idx]
        chunk_text = " ".join(chunk_words)

        # Approximate character positions
        start_char = len(" ".join(words[:idx])) + (1 if idx > 0 else 0)
        end_char = start_char + len(chunk_text)

        chunks.append(
            Chunk(
                text=chunk_text,
                source=source,
                chunk_index=chunk_num,
                start_char=start_char,
                end_char=end_char,
            )
        )

        chunk_num += 1
        idx += size - overlap

        # Avoid infinite loop if overlap >= size
        if size - overlap <= 0:
            break

    return chunks
