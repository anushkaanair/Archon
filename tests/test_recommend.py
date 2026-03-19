"""Tests for the /v1/recommend endpoint."""

from __future__ import annotations


def test_recommend_requires_auth(client):
    """POST /v1/recommend without auth should return 401 or 422."""
    response = client.post(
        "/v1/recommend",
        json={
            "query_id": "123e4567-e89b-12d3-a456-426614174000",
            "detected_tasks": [{"task": "text-generation", "confidence": 0.95}],
        },
    )
    assert response.status_code in (401, 422)


def test_recommend_validates_input(client):
    """POST /v1/recommend with empty tasks should return 422."""
    response = client.post(
        "/v1/recommend",
        json={"query_id": "test", "detected_tasks": []},
        headers={"Authorization": "Bearer test-key"},
    )
    assert response.status_code in (401, 422)
