"""Query ORM model.

Records every user query submitted to /v1/analyze. Stores the raw input
text, detected AI tasks (as a JSONB array), and processing status so that
async Celery jobs can update progress.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Query(Base):
    """User-submitted natural-language product idea."""

    __tablename__ = "queries"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="User who submitted this query.",
    )
    input_text: Mapped[str] = mapped_column(
        Text, nullable=False,
        doc="Raw natural-language product idea.",
    )
    detected_tasks: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]",
        doc="AI tasks detected by the semantic analysis layer "
            "(e.g. [{task: 'rag', confidence: 0.92}]).",
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending",
        index=True,
        doc="Processing status: pending → processing → completed | failed.",
    )
    request_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True,
        doc="Trace ID from the X-Request-ID header for observability.",
    )

    # ── Relationships ────────────────────────────────────────────
    user = relationship("User", back_populates="queries")
    blueprints = relationship("Blueprint", back_populates="query", lazy="selectin")
    eval_results = relationship("EvalResult", back_populates="query", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Query id={self.id!s:.8} status={self.status}>"
