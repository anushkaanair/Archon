"""FastAPI middleware stack.

Provides:
- **RequestIDMiddleware**: injects a unique ``X-Request-ID`` header into every
  request/response for end-to-end tracing.
- **RateLimitMiddleware**: Redis-backed sliding-window rate limiter that
  respects the user's tier (free: 100 req/min, pro: 1000 req/min). Returns
  429 with ``Retry-After`` header when exceeded.
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import get_settings


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID to every request for observability.

    If the client sends an ``X-Request-ID`` header it is reused; otherwise
    a new UUID v4 is generated. The ID is stored on ``request.state`` and
    echoed back in the response headers.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Process the request and attach a request ID."""
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Redis-backed sliding-window rate limiter.

    Checks the authenticated user's tier and enforces the corresponding
    request-per-minute limit. Unauthenticated requests use the free-tier
    limit keyed by IP address.

    When the limit is exceeded, returns HTTP 429 with a ``Retry-After``
    header indicating seconds until the window resets.
    """

    def __init__(self, app: Any, redis_client: Any = None) -> None:
        super().__init__(app)
        self.redis = redis_client
        self.settings = get_settings()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Check rate limit before forwarding the request."""
        # Skip rate limiting if Redis is not available (dev mode)
        if self.redis is None:
            return await call_next(request)

        # Determine the rate limit key and max requests
        user = getattr(request.state, "user", None)
        if user:
            key = f"ratelimit:user:{user.id}"
            max_requests = (
                self.settings.rate_limit_pro
                if user.tier == "pro"
                else self.settings.rate_limit_free
            )
        else:
            client_ip = request.client.host if request.client else "unknown"
            key = f"ratelimit:ip:{client_ip}"
            max_requests = self.settings.rate_limit_free

        window = 60  # 1-minute sliding window

        now = time.time()
        window_start = now - window

        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window)
        results = await pipe.execute()

        current_count = results[2]

        if current_count > max_requests:
            retry_after = int(window - (now - window_start))
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Rate limit of {max_requests} requests per minute exceeded.",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - current_count))
        return response
