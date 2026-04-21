"""V1 API router aggregator.

Mounts all v1 endpoint routers under taglined groups for clean
OpenAPI documentation.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.analyze import router as analyze_router
from app.api.v1.architect import router as architect_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.estimate import router as estimate_router
from app.api.v1.explain import router as explain_router
from app.api.v1.models import router as models_router
from app.api.v1.recommend import router as recommend_router

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(analyze_router, tags=["Analyze"])
v1_router.include_router(recommend_router, tags=["Recommend"])
v1_router.include_router(architect_router, tags=["Architect"])
v1_router.include_router(estimate_router, tags=["Estimate"])
v1_router.include_router(explain_router, tags=["Explain"])
v1_router.include_router(models_router, tags=["Models"])
v1_router.include_router(dashboard_router, tags=["Dashboard"])
