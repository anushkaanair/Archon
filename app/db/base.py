"""SQLAlchemy declarative base and reusable column mixins.

Every table in Archon inherits from ``Base`` which automatically provides:
- ``id``: UUID primary key (server-generated)
- ``created_at``: immutable timestamp
- ``updated_at``: auto-updating timestamp
- ``deleted_at``: nullable soft-delete timestamp
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base shared by all Archon ORM models.

    Provides the mandatory four columns required by the Archon database rules:
    ``id``, ``created_at``, ``updated_at``, ``deleted_at``.
    """

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique record identifier (UUID v4).",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Immutable creation timestamp.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Last-modified timestamp, auto-updated on every write.",
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        doc="Soft-delete timestamp. Non-null means the record is logically deleted.",
    )
