"""Tests for the semantic analyzer service."""

from __future__ import annotations


def test_task_definitions_are_valid():
    """All task definitions should have required fields."""
    from app.services.semantic_analyzer import TASK_DEFINITIONS

    for td in TASK_DEFINITIONS:
        assert "task" in td, f"Missing 'task' key in {td}"
        assert "name" in td, f"Missing 'name' key in {td}"
        assert "anchor" in td, f"Missing 'anchor' key in {td}"
        assert len(td["anchor"]) > 10, f"Anchor too short in {td['task']}"


def test_task_definitions_unique_slugs():
    """All task slugs must be unique."""
    from app.services.semantic_analyzer import TASK_DEFINITIONS

    slugs = [td["task"] for td in TASK_DEFINITIONS]
    assert len(slugs) == len(set(slugs)), "Duplicate task slugs found"
