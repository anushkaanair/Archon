"""Application settings loaded from environment variables.

Uses pydantic-settings to validate and type all configuration. Every setting
has a sensible default for local development but MUST be overridden in
production via environment variables or a `.env` file.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Archon backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    app_name: str = "Archon"
    app_version: str = "0.1.0"
    debug: bool = False

    # ── Database (SQLite + aiosqlite) ──────────────────────────
    database_url: str = "sqlite+aiosqlite:///./archon.db"

    # ── Redis ────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Qdrant ───────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "archon_knowledge_base"

    # ── Celery ───────────────────────────────────────────────────
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # ── Langfuse ─────────────────────────────────────────────────
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"

    # ── LLM Providers ────────────────────────────────────────────
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""

    # ── Auth ─────────────────────────────────────────────────────
    api_key_hash_secret: str = "change-me-in-production"
    jwt_secret: str = "archon-jwt-secret-change-in-production"
    frontend_url: str = "http://localhost:5174"
    backend_url: str = "http://localhost:8000"

    # ── OAuth ─────────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""

    # ── Rate Limiting (requests per minute) ──────────────────────
    rate_limit_free: int = 100
    rate_limit_pro: int = 1000

    # ── Model Registry Cache ─────────────────────────────────────
    model_registry_cache_ttl: int = 3600  # 1 hour in seconds

    # ── ML Models ────────────────────────────────────────────────
    embedding_model: str = "all-MiniLM-L6-v2"
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # ── Chunking ─────────────────────────────────────────────────
    chunk_size: int = 512
    chunk_overlap: int = 50

    # ── RAGAs ────────────────────────────────────────────────────
    ragas_low_confidence_threshold: float = 0.7


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton of application settings.

    Uses ``lru_cache`` so the env file is read only once per process.
    """
    return Settings()
