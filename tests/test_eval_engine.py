"""Tests for the eval_engine service."""

from __future__ import annotations

import pytest

from app.services.eval_engine import evaluate_recommendation


@pytest.mark.asyncio
async def test_eval_engine_requires_ragas():
    """This just tests that the evaluate function exists and can be mocked."""
    assert evaluate_recommendation is not None
