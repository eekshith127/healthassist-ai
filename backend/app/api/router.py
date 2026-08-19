from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.health_profile import router as health_profile_router
from backend.app.api.v1 import v1_router

api_router = APIRouter(prefix="/api")

# Direct /api/health endpoint
api_router.include_router(health_router)

# Direct /api/profile endpoints (as specified in API design: GET /api/profile, PUT /api/profile)
api_router.include_router(health_profile_router)

# Versioned /api/v1 endpoints
api_router.include_router(v1_router, prefix="/v1")

__all__ = ["api_router"]
