"""Eval Result ORM model.

Stores per-blueprint RAGAs evaluation results. Every recommendation output
triggers an eval pass that computes faithfulness, answer relevancy, context
precision, and context recall. A composite score is derived and a boolean
flag marks any result below the low-confidence threshold (0.7 by default).
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EvalResult(Base):
    """RAGAs evaluation result for a single blueprint."""

    __tablename__ = "eval_results"

    blueprint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("blueprints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Blueprint that was evaluated.",
    )
    query_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("queries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Original query for context linking.",
    )
    faithfulness: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        doc="RAGAs faithfulness score (0.0–1.0): are claims supported by retrieved context?",
    )
    answer_relevancy: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        doc="RAGAs answer relevancy (0.0–1.0): is the answer relevant to the question?",
    )
    context_precision: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        doc="RAGAs context precision (0.0–1.0): are retrieved chunks precise?",
    )
    context_recall: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        doc="RAGAs context recall (0.0–1.0): do retrieved chunks cover the answer?",
    )
    composite_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        doc="Weighted average of all RAGAs metrics.",
    )
    is_low_confidence: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false",
        doc="True if composite_score < low-confidence threshold (default 0.7).",
    )
    raw_output: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True,
        doc="Full RAGAs evaluation output for debugging.",
    )

    # ── Relationships ────────────────────────────────────────────
    blueprint = relationship("Blueprint", back_populates="eval_results")
    query = relationship("Query", back_populates="eval_results")

    def __repr__(self) -> str:
        return f"<EvalResult id={self.id!s:.8} score={self.composite_score}>"
