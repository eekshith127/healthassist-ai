from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.me import router as me_router
from backend.app.api.v1.profile import router as profile_router
from backend.app.api.v1.assessment import router as assessment_router
from backend.app.api.v1.providers import router as providers_router
from backend.app.api.v1 import v1_router

api_router = APIRouter(prefix="/api")

# Mount routes directly under /api
api_router.include_router(health_router)
api_router.include_router(me_router)
api_router.include_router(profile_router)
api_router.include_router(assessment_router)
api_router.include_router(providers_router)

# Also mount under /api/v1 for versioned clients
api_router.include_router(v1_router, prefix="/v1")

__all__ = ["api_router"]
