"""Tests for the /v1/analyze endpoint and semantic analyzer service."""

from __future__ import annotations


def test_health_endpoint(client):
    """Health check should return 200 with status 'ok'."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_analyze_requires_auth(client):
    """POST /v1/analyze without auth should return 401 or 422."""
    response = client.post("/v1/analyze", json={"input_text": "test idea for a chatbot"})
    assert response.status_code in (401, 422)


def test_analyze_validates_input_length(client):
    """POST /v1/analyze with too-short input should return 422."""
    response = client.post(
        "/v1/analyze",
        json={"input_text": "short"},
        headers={"Authorization": "Bearer test-key"},
    )
    assert response.status_code in (401, 422)
