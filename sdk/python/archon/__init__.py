"""Archon Python SDK.

Provides ``ArchonClient`` (sync) and ``AsyncArchonClient`` (async) for
interacting with the Archon API. Supports Python 3.9+.

Usage::

    from archon import ArchonClient

    client = ArchonClient(api_key="arch_xxx")
    result = client.architect("A legal Q&A bot with citation tracking")
    print(result.architecture_diagram)
"""

from archon.client import ArchonClient
from archon.async_client import AsyncArchonClient
from archon.models import (
    AnalyzeResult,
    RecommendResult,
    ArchitectResult,
    EstimateResult,
    ExplainResult,
    ModelsResult,
)
from archon.exceptions import (
    ArchonError,
    ArchonAuthError,
    ArchonRateLimitError,
    ArchonValidationError,
    ArchonServerError,
)

__version__ = "0.1.0"
__all__ = [
    "ArchonClient",
    "AsyncArchonClient",
    "AnalyzeResult",
    "RecommendResult",
    "ArchitectResult",
    "EstimateResult",
    "ExplainResult",
    "ModelsResult",
    "ArchonError",
    "ArchonAuthError",
    "ArchonRateLimitError",
    "ArchonValidationError",
    "ArchonServerError",
]
