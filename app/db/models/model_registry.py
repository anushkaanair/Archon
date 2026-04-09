"""Model Registry ORM model.

Stores metadata about every AI model Archon can recommend: provider, name,
capabilities, pricing (with source URL), latency benchmarks, and quality
scores. Pricing is never hardcoded — the ``pricing_source`` field must link
to an official provider pricing page or benchmark report.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ModelRegistryEntry(Base):
    """A single AI model available for recommendation."""

    __tablename__ = "model_registry"

    provider: Mapped[str] = mapped_column(
        String(50), nullable=False,
        doc="Provider slug: openai, anthropic, google, open_source.",
    )
    model_name: Mapped[str] = mapped_column(
        String(100), nullable=False,
        doc="Model identifier (e.g. 'gpt-4o', 'claude-sonnet-4-20250514').",
    )
    model_version: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
        doc="Optional version pin (e.g. '2024-01-25').",
    )
    capabilities: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]",
        doc="List of supported task types: rag, image_gen, code_gen, classification, etc.",
    )
    pricing: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False,
        doc="Pricing structure: {input_per_1m_tokens, output_per_1m_tokens, ...}.",
    )
    pricing_source: Mapped[str] = mapped_column(
        String(500), nullable=False,
        doc="URL to the official pricing page where these numbers were obtained.",
    )
    pricing_fetched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        doc="When pricing was last fetched from the source.",
    )
    latency_p50_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        doc="Median (p50) latency in milliseconds from published benchmarks.",
    )
    latency_p95_ms: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        doc="95th-percentile latency in milliseconds from published benchmarks.",
    )
    latency_source: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
        doc="URL to the benchmark report for latency numbers.",
    )
    quality_scores: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True,
        doc="Quality benchmark scores: {mmlu, humaneval, arena_elo, ...}.",
    )
    quality_source: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
        doc="URL to the benchmark report for quality scores.",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true",
        doc="Inactive models are excluded from recommendations.",
    )

    # Composite unique constraint on (provider, model_name)
    __table_args__ = (
        # The unique index is defined here to match the SQL schema
        # UniqueConstraint handled via the unique index created directly
    )

    def __repr__(self) -> str:
        return f"<ModelRegistryEntry {self.provider}/{self.model_name}>"
