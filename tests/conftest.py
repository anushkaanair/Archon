"""Pytest configuration and shared fixtures for Archon tests."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def app():
    """Create a fresh FastAPI app instance for testing."""
    return create_app()


@pytest.fixture
def client(app):
    """Create a synchronous test client."""
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Create a mock async database session."""
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def mock_redis():
    """Create a mock async Redis client."""
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()
    redis.delete = AsyncMock()
    redis.pipeline = MagicMock()
    return redis


@pytest.fixture
def sample_user_id():
    """Return a sample user UUID."""
    return str(uuid.uuid4())


@pytest.fixture
def sample_input_text():
    """Return a sample product idea for testing."""
    return (
        "A legal document Q&A bot for law firms with citation tracking, "
        "multi-language support, and real-time document analysis."
    )
