"""API Key ORM model.

Each user can have multiple API keys. Keys are stored as SHA-256 hashes —
the raw key is shown only once at creation time. A short prefix (first 8
chars) is stored separately for user-facing identification (e.g. "arch_3xF…").
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApiKey(Base):
    """Bearer token used to authenticate API requests."""

    __tablename__ = "api_keys"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner of this API key.",
    )
    key_hash: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True,
        doc="SHA-256 hash of the raw API key.",
    )
    key_prefix: Mapped[str] = mapped_column(
        String(8), nullable=False,
        doc="First 8 characters of the key for display purposes.",
    )
    name: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
        doc="Optional human-readable label (e.g. 'Production key').",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true",
        doc="Revoked keys have is_active=False.",
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        doc="Timestamp of the most recent authenticated request with this key.",
    )

    # ── Relationships ────────────────────────────────────────────
    user = relationship("User", back_populates="api_keys")

    def __repr__(self) -> str:
        return f"<ApiKey id={self.id!s:.8} prefix={self.key_prefix}>"
