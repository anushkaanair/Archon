"""Tests for the /v1/models endpoint."""

from __future__ import annotations


def test_models_requires_auth(client):
    """GET /v1/models without auth should return 401 or 422."""
    response = client.get("/v1/models")
    assert response.status_code in (401, 422)
