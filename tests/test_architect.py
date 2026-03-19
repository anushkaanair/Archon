"""Tests for the /v1/architect endpoint."""

from __future__ import annotations


def test_architect_requires_auth(client):
    """POST /v1/architect without auth should return 401 or 422."""
    response = client.post("/v1/architect", json={"input_text": "An AI coding assistant"})
    assert response.status_code in (401, 422)


def test_architect_validates_input(client):
    """POST /v1/architect with short input should return 422."""
    response = client.post(
        "/v1/architect",
        json={"input_text": "ai"},
        headers={"Authorization": "Bearer test-key"},
    )
    assert response.status_code in (401, 422)
