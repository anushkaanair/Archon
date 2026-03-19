"""User ORM model.

Stores registered users who access the Archon API. Each user has a tier
(free / pro) that determines their rate limit.
"""

from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    """Registered Archon user."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True, doc="Unique email address."
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="bcrypt-hashed password."
    )
    tier: Mapped[str] = mapped_column(
        String(20), nullable=False, default="free", server_default="free",
        doc="Subscription tier: 'free' or 'pro'. Controls rate limits.",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true",
        doc="Whether the account is active. Inactive accounts cannot authenticate.",
    )

    # ── Relationships ────────────────────────────────────────────
    api_keys = relationship("ApiKey", back_populates="user", lazy="selectin")
    queries = relationship("Query", back_populates="user", lazy="selectin")
    blueprints = relationship("Blueprint", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User id={self.id!s:.8} email={self.email}>"
