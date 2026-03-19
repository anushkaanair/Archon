"""Tests for the RAG engine."""

from __future__ import annotations

from app.rag.chunker import chunk_text


def test_chunker_produces_chunks():
    """Chunker should split long text into multiple chunks."""
    text = " ".join(["word"] * 1000)
    chunks = chunk_text(text, source="test", chunk_size=100, chunk_overlap=10)
    assert len(chunks) > 1


def test_chunker_preserves_source():
    """Each chunk should retain the source metadata."""
    chunks = chunk_text("some text here for testing purposes only", source="test.md")
    for chunk in chunks:
        assert chunk.source == "test.md"


def test_chunker_empty_text():
    """Chunker should return empty list for empty text."""
    chunks = chunk_text("", source="empty")
    assert chunks == []


def test_chunk_to_dict():
    """Chunk.to_dict() should produce a valid payload dict."""
    chunks = chunk_text("some text for a test chunk here with enough words", source="test")
    if chunks:
        d = chunks[0].to_dict()
        assert "text" in d
        assert "source" in d
        assert "chunk_index" in d
