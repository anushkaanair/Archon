"""Typed exception hierarchy for the Archon SDK.

All exceptions are typed — no raw string errors. Each exception class
corresponds to a specific HTTP status code from the API.
"""

from __future__ import annotations


class ArchonError(Exception):
    """Base exception for all Archon SDK errors.

    Attributes:
        message: Human-readable error description.
        status_code: HTTP status code from the API (if applicable).
        request_id: Trace ID for debugging.
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        request_id: str | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.request_id = request_id
        super().__init__(message)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({self.message!r}, status_code={self.status_code})"


class ArchonAuthError(ArchonError):
    """Raised when the API key is invalid or missing (HTTP 401).

    The raw API key is NEVER included in the error message or repr —
    this is a security requirement.
    """

    def __init__(self, message: str = "Invalid or missing API key.", request_id: str | None = None):
        super().__init__(message, status_code=401, request_id=request_id)


class ArchonRateLimitError(ArchonError):
    """Raised when the rate limit is exceeded (HTTP 429).

    Attributes:
        retry_after: Seconds to wait before retrying.
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded.",
        retry_after: int = 60,
        request_id: str | None = None,
    ):
        self.retry_after = retry_after
        super().__init__(message, status_code=429, request_id=request_id)


class ArchonValidationError(ArchonError):
    """Raised when the request body fails validation (HTTP 422)."""

    def __init__(self, message: str = "Validation error.", request_id: str | None = None):
        super().__init__(message, status_code=422, request_id=request_id)


class ArchonServerError(ArchonError):
    """Raised on internal server errors (HTTP 500)."""

    def __init__(self, message: str = "Internal server error.", request_id: str | None = None):
        super().__init__(message, status_code=500, request_id=request_id)
