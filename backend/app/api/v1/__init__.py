from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.me import router as me_router
from backend.app.api.v1.profile import router as profile_router
from backend.app.api.v1.assessment import router as assessment_router
from backend.app.api.v1.intake import router as intake_router
from backend.app.api.v1.medical_assessment import router as medical_assessment_router
from backend.app.api.v1.health_card import router as health_card_router

v1_router = APIRouter()
v1_router.include_router(health_router)
v1_router.include_router(me_router)
v1_router.include_router(profile_router)
v1_router.include_router(assessment_router)
v1_router.include_router(intake_router)
v1_router.include_router(medical_assessment_router)
v1_router.include_router(health_card_router)

__all__ = ["v1_router", "intake_router", "medical_assessment_router", "health_card_router"]
