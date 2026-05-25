"""Structured JSON logging for Archon.

Every log record is emitted as a single JSON line with consistent fields:
  timestamp, level, logger, message, request_id (when available).

Usage::

    from app.logging_config import get_logger
    log = get_logger(__name__)
    log.info("Blueprint generated", blueprint_id="abc", duration_ms=412)

Call ``configure_logging()`` once at app startup (already done in main.py).
"""

from __future__ import annotations

import json
import logging
import sys
import time
from typing import Any


class _JSONFormatter(logging.Formatter):
    """Emit log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)
            ),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Attach any extra kwargs passed to the log call
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "exc_info", "exc_text", "stack_info",
                "lineno", "funcName", "created", "msecs", "relativeCreated",
                "thread", "threadName", "processName", "process", "message",
                "taskName",
            }:
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def configure_logging(level: str = "INFO") -> None:
    """Configure the root logger to emit JSON.

    Call this once at application startup. All subsequent ``logging.getLogger``
    calls inherit the JSON handler.
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JSONFormatter())

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove default handlers to avoid duplicate output
    root.handlers.clear()
    root.addHandler(handler)

    # Quieten noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger (call this at module level).

    Example::

        log = get_logger(__name__)
        log.info("Task detected", task="rag", confidence=0.95)
    """
    return logging.getLogger(name)
