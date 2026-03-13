"""User ORM model — supports password and OAuth authentication."""

from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    """Registered Archon user."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    tier: Mapped[str] = mapped_column(
        String(20), nullable=False, default="free", server_default="free",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true",
    )

    # ── Relationships ────────────────────────────────────────────
    api_keys = relationship("ApiKey", back_populates="user", lazy="selectin")
    queries = relationship("Query", back_populates="user", lazy="selectin")
    blueprints = relationship("Blueprint", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User id={self.id!s:.8} email={self.email}>"
