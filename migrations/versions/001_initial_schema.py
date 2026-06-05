"""Initial schema — all Archon tables.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-06-05 00:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None

_TIMESTAMPS = [
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
]


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("provider", sa.String(32), nullable=True),
        sa.Column("provider_id", sa.String(255), nullable=True),
        sa.Column("tier", sa.String(20), nullable=False, server_default="free"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_provider_id", "users", ["provider_id"])

    # ── api_keys ───────────────────────────────────────────────────────────────
    op.create_table(
        "api_keys",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key_hash", sa.String(255), unique=True, nullable=False),
        sa.Column("key_prefix", sa.String(8), nullable=False),
        sa.Column("name", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scopes", sa.String(255), nullable=False, server_default="*"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_api_keys_user_id", "api_keys", ["user_id"])
    op.create_index("ix_api_keys_key_hash", "api_keys", ["key_hash"])

    # ── queries ────────────────────────────────────────────────────────────────
    op.create_table(
        "queries",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("input_text", sa.Text, nullable=False),
        sa.Column("detected_tasks", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_queries_user_id", "queries", ["user_id"])

    # ── blueprints ─────────────────────────────────────────────────────────────
    op.create_table(
        "blueprints",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("query_id", sa.Uuid(as_uuid=True), sa.ForeignKey("queries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("is_public", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("architecture_json", sa.JSON, nullable=False),
        sa.Column("architecture_diagram", sa.Text, nullable=True),
        sa.Column("model_recommendations", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("cost_estimate", sa.JSON, nullable=True),
        sa.Column("latency_estimate", sa.JSON, nullable=True),
        sa.Column("explanation", sa.Text, nullable=True),
        sa.Column("benchmark_citations", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("eval_score", sa.Float, nullable=True),
        sa.Column("eval_details", sa.JSON, nullable=True),
        sa.Column("confidence_flag", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_blueprints_user_id", "blueprints", ["user_id"])
    op.create_index("ix_blueprints_query_id", "blueprints", ["query_id"])
    op.create_index("ix_blueprints_status", "blueprints", ["status"])
    op.create_index("ix_blueprints_user_created", "blueprints", ["user_id", "created_at"])

    # ── eval_results ───────────────────────────────────────────────────────────
    op.create_table(
        "eval_results",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("blueprint_id", sa.Uuid(as_uuid=True), sa.ForeignKey("blueprints.id", ondelete="CASCADE"), nullable=False),
        sa.Column("metric", sa.String(64), nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("details", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_eval_results_blueprint_id", "eval_results", ["blueprint_id"])

    # ── knowledge_chunks ───────────────────────────────────────────────────────
    op.create_table(
        "knowledge_chunks",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("chunk_id", sa.String(64), unique=True, nullable=False),
        sa.Column("source", sa.String(512), nullable=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        # embedding stored as Text fallback; pgvector applied post-migration
        sa.Column("embedding", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_knowledge_chunks_chunk_id", "knowledge_chunks", ["chunk_id"])

    # ── model_registry ─────────────────────────────────────────────────────────
    op.create_table(
        "model_registry",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("model_id", sa.String(128), unique=True, nullable=False),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("capabilities", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("cost_per_1m_input", sa.Float, nullable=True),
        sa.Column("cost_per_1m_output", sa.Float, nullable=True),
        sa.Column("context_window", sa.Integer, nullable=True),
        sa.Column("quality_score", sa.Float, nullable=True),
        sa.Column("speed_score", sa.Float, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("raw_data", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_model_registry_model_id", "model_registry", ["model_id"])
    op.create_index("ix_model_registry_provider", "model_registry", ["provider"])


def downgrade() -> None:
    op.drop_table("model_registry")
    op.drop_table("knowledge_chunks")
    op.drop_table("eval_results")
    op.drop_table("blueprints")
    op.drop_table("queries")
    op.drop_table("api_keys")
    op.drop_table("users")
