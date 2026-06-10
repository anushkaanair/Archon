"""KnowledgeChunk ORM model — pgvector-backed document chunks.

Stores embedded document chunks for RAG retrieval. Requires PostgreSQL
with the pgvector extension enabled (Railway PostgreSQL addon supports this).

On SQLite (local dev without PostgreSQL), the table won't be created and
knowledge-base ingestion/retrieval will be skipped gracefully.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Index, String, Text
from sqlalchemy import JSON as SASJSON
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

import os

# Use the VECTOR column only when BOTH conditions hold:
#   1. The pgvector Python package is importable (always true if installed).
#   2. The deployment has explicitly opted in via PGVECTOR_ENABLED=true.
# Render's free-tier Postgres does not grant CREATE EXTENSION privileges, so
# even with the package present we must fall back to a TEXT column or
# CREATE TABLE will fail with 'type "vector" does not exist'.
_PGVECTOR_OPTED_IN = os.getenv("PGVECTOR_ENABLED", "").lower() in {"1", "true", "yes"}

try:
    from pgvector.sqlalchemy import Vector as PGVector

    _HAVE_PGVECTOR = _PGVECTOR_OPTED_IN
except ImportError:  # pragma: no cover
    _HAVE_PGVECTOR = False


class KnowledgeChunk(Base):
    """A single embedded document chunk stored for hybrid retrieval."""

    __tablename__ = "knowledge_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    chunk_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(512), nullable=False)
    chunk_metadata: Mapped[dict] = mapped_column("metadata", SASJSON, default=dict)

    # Vector column — only meaningful on PostgreSQL + pgvector.
    # Stored as JSON text on SQLite (local dev) so the schema still works.
    if _HAVE_PGVECTOR:
        embedding: Mapped[list] = mapped_column(PGVector(768), nullable=True)
    else:
        embedding: Mapped[str | None] = mapped_column(Text, nullable=True)  # type: ignore[assignment]

    __table_args__ = (
        Index("ix_knowledge_chunks_source", "source"),
    )

    def to_dict(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "text": self.text,
            "source": self.source,
            "metadata": self.chunk_metadata or {},
        }
