"""Langfuse tracing wrapper for the Archon pipeline.

Every pipeline call is traced end-to-end. Each trace captures:
input, retrieved chunks, model used, output, latency, and eval score.

API keys and raw user emails are NEVER logged in plain text.
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Any

from app.config import get_settings


class LangfuseTracer:
    """Wrapper around the Langfuse SDK for pipeline tracing.

    Initialised once during app startup. If Langfuse keys are not
    configured, all methods become no-ops (safe for local dev).
    """

    def __init__(self) -> None:
        """Initialise the Langfuse client if keys are available."""
        settings = get_settings()
        self._client = None
        self._enabled = bool(settings.langfuse_public_key and settings.langfuse_secret_key)

        if self._enabled:
            try:
                from langfuse import Langfuse

                self._client = Langfuse(
                    public_key=settings.langfuse_public_key,
                    secret_key=settings.langfuse_secret_key,
                    host=settings.langfuse_host,
                )
            except Exception:
                self._enabled = False

    @asynccontextmanager
    async def trace(self, name: str, request_id: str | None = None, metadata: dict | None = None):
        """Context manager that creates a Langfuse trace.

        Usage::

            async with tracer.trace("analyze", request_id="abc123") as t:
                t.log_input({"text": "..."})
                # ... pipeline work ...
                t.log_output({"tasks": [...]})
        """
        span = _TraceSpan(
            tracer=self,
            name=name,
            request_id=request_id,
            metadata=metadata or {},
        )
        try:
            yield span
        finally:
            span.end()

    def _create_trace(self, name: str, request_id: str | None, metadata: dict) -> Any:
        """Create a raw Langfuse trace object."""
        if not self._enabled or not self._client:
            return None
        return self._client.trace(
            name=name,
            id=request_id,
            metadata=metadata,
        )

    def flush(self) -> None:
        """Flush any pending traces to Langfuse."""
        if self._enabled and self._client:
            self._client.flush()


class _TraceSpan:
    """Internal helper representing a single trace span."""

    def __init__(
        self,
        tracer: LangfuseTracer,
        name: str,
        request_id: str | None,
        metadata: dict,
    ) -> None:
        self._tracer = tracer
        self._name = name
        self._start = time.perf_counter()
        self._trace = tracer._create_trace(name, request_id, metadata)
        self._data: dict[str, Any] = {}

    def log_input(self, data: dict) -> None:
        """Record the pipeline input (sanitised — no API keys or PII)."""
        self._data["input"] = data
        if self._trace:
            self._trace.update(input=data)

    def log_retrieval(self, chunks: list[dict], confidence: float) -> None:
        """Record retrieved RAG chunks and confidence score."""
        self._data["retrieved_chunks"] = chunks
        self._data["retrieval_confidence"] = confidence
        if self._trace:
            self._trace.update(
                metadata={
                    "retrieved_chunks": len(chunks),
                    "retrieval_confidence": confidence,
                }
            )

    def log_model(self, model_name: str, provider: str) -> None:
        """Record which model was used for reasoning."""
        self._data["model"] = f"{provider}/{model_name}"
        if self._trace:
            self._trace.update(metadata={"model": f"{provider}/{model_name}"})

    def log_output(self, data: dict) -> None:
        """Record the pipeline output."""
        self._data["output"] = data
        if self._trace:
            self._trace.update(output=data)

    def log_eval(self, score: float, details: dict) -> None:
        """Record the RAGAs evaluation score."""
        self._data["eval_score"] = score
        self._data["eval_details"] = details
        if self._trace:
            self._trace.update(
                metadata={"eval_score": score, "eval_details": details}
            )

    def end(self) -> None:
        """Finalise the span and record latency."""
        latency_ms = int((time.perf_counter() - self._start) * 1000)
        self._data["latency_ms"] = latency_ms
        if self._trace:
            self._trace.update(metadata={"latency_ms": latency_ms})


# Module-level singleton
_tracer: LangfuseTracer | None = None


def get_tracer() -> LangfuseTracer:
    """Return the global Langfuse tracer instance (lazy-initialised)."""
    global _tracer
    if _tracer is None:
        _tracer = LangfuseTracer()
    return _tracer
