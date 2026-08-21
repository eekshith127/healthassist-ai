import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.health_profile import HealthProfile
from backend.app.services.health_profile_service import health_profile_service
from backend.app.schemas.health_profile import PatientCaseContext
from backend.app.schemas.profile import HealthProfileUpdate, HealthProfileRead
from backend.app.utils.clerk_auth import get_current_user
from backend.app.utils.logger import logger

router = APIRouter(prefix="/profile", tags=["Health Profile"])


def _serialize_list(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, list):
        return json.dumps(val)
    return str(val)


def _parse_list(val: Any) -> List[str]:
    if not val:
        return []
    if isinstance(val, list):
        return val
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return [s.strip() for s in str(val).split(",") if s.strip()]


def _build_profile_response(profile: HealthProfile) -> Dict[str, Any]:
    height = profile.height_cm
    weight = profile.weight_kg
    bmi, category = health_profile_service.calculate_bmi(height, weight)
    age = profile.age or health_profile_service.calculate_age(profile.date_of_birth)

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "age": age,
        "gender": profile.gender or profile.sex,
        "sex": profile.sex or profile.gender,
        "date_of_birth": profile.date_of_birth,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "blood_type": profile.blood_type or profile.blood_group,
        "blood_group": profile.blood_group or profile.blood_type,
        "medical_conditions": _parse_list(profile.medical_conditions or profile.chronic_conditions),
        "chronic_conditions": profile.chronic_conditions or profile.medical_conditions,
        "medications": _parse_list(profile.medications or profile.current_medications),
        "current_medications": profile.current_medications or profile.medications,
        "allergies": _parse_list(profile.allergies),
        "previous_surgeries": _parse_list(profile.previous_surgeries),
        "family_history": _parse_list(profile.family_history),
        "emergency_contact": profile.emergency_contact,
        "emergency_phone": profile.emergency_phone,
        "bmi": bmi,
        "bmi_category": category,
        "is_completed": profile.is_completed,
        "profile_completed": profile.is_completed or bool(profile.profile_completed),
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.get("", response_model=Dict[str, Any])
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user's electronic health profile."""
    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        profile = HealthProfile(
            user_id=current_user.id,
            date_of_birth="1994-05-14",
            sex="male",
            gender="Male",
            height_cm=180.0,
            weight_kg=75.0,
            blood_group="O+",
            blood_type="O-Positive (O+)",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return _build_profile_response(profile)


@router.put("", response_model=Dict[str, Any])
def update_user_profile(
    payload: HealthProfileUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the authenticated user's health profile."""
    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == current_user.id)
        .first()
    )

    data = payload.model_dump(exclude_unset=True)

    if not profile:
        profile = HealthProfile(user_id=current_user.id)
        db.add(profile)

    for k, v in data.items():
        if k in ("medical_conditions", "medications", "allergies", "previous_surgeries", "family_history"):
            setattr(profile, k, _serialize_list(v))
        elif hasattr(profile, k) and v is not None:
            setattr(profile, k, v)

    # Sync aliases
    if "blood_group" in data and not profile.blood_type:
        profile.blood_type = data["blood_group"]
    if "blood_type" in data and not profile.blood_group:
        profile.blood_group = data["blood_type"]
    if "sex" in data and not profile.gender:
        profile.gender = data["sex"]
    if "gender" in data and not profile.sex:
        profile.sex = data["gender"]

    if profile.is_completed:
        profile.profile_completed = True

    db.commit()
    db.refresh(profile)
    logger.info(f"Health profile updated for user ID: {current_user.id}")
    return _build_profile_response(profile)


@router.get("/clinical-context", response_model=PatientCaseContext)
def get_clinical_context(
    chief_complaint: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = health_profile_service.get_or_create_profile(db, user_id=current_user.id)
    return health_profile_service.get_selective_clinical_context(
        profile, chief_complaint=chief_complaint
    )
