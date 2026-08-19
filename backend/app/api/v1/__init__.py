from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.me import router as me_router
from backend.app.api.v1.profile import router as profile_router
from backend.app.api.v1.assessment import router as assessment_router
from backend.app.api.v1.providers import router as providers_router
from backend.app.api.v1.health_profile import router as health_profile_router

v1_router = APIRouter()
v1_router.include_router(health_router)
v1_router.include_router(me_router)
v1_router.include_router(profile_router)
v1_router.include_router(assessment_router)
v1_router.include_router(providers_router)
v1_router.include_router(health_profile_router)

__all__ = ["v1_router", "health_profile_router"]
