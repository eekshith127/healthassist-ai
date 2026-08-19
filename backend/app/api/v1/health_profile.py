from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.health_profile import (
    HealthProfileUpdate,
    HealthProfileResponse,
    PatientCaseContext,
)
from backend.app.services.health_profile_service import health_profile_service

router = APIRouter(tags=["Health Profile"])


@router.get(
    "/profile",
    response_model=HealthProfileResponse,
    summary="Get user health profile",
    description="Retrieves the persistent medical profile, biometrics, and calculated BMI for the authenticated patient.",
)
def get_health_profile(db: Session = Depends(get_db)):
    # Default user_id=1 for single-patient / session context
    return health_profile_service.get_or_create_profile(db, user_id=1)


@router.put(
    "/profile",
    response_model=HealthProfileResponse,
    summary="Update user health profile",
    description="Updates biometrics, allergies, medications, and medical conditions with automatic BMI re-calculation.",
)
def update_health_profile(
    profile_in: HealthProfileUpdate, db: Session = Depends(get_db)
):
    return health_profile_service.update_profile(db, user_id=1, data=profile_in)


@router.get(
    "/profile/clinical-context",
    response_model=PatientCaseContext,
    summary="Get privacy-conscious clinical context",
    description="Extracts only relevant medical context for AI triage without sending full profile to LLMs.",
)
def get_clinical_context(
    chief_complaint: str = None, db: Session = Depends(get_db)
):
    profile = health_profile_service.get_or_create_profile(db, user_id=1)
    return health_profile_service.get_selective_clinical_context(
        profile, chief_complaint=chief_complaint
    )
