"""Tests for the /v1/estimate endpoint."""

from __future__ import annotations


def test_estimate_requires_auth(client):
    """POST /v1/estimate without auth should return 401 or 422."""
    response = client.post(
        "/v1/estimate",
        json={"blueprint_id": "123e4567-e89b-12d3-a456-426614174000", "monthly_request_volume": 1000},
    )
    assert response.status_code in (401, 422)
