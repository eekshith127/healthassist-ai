import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.health_profile import HealthProfile
from backend.app.services.health_profile_service import health_profile_service
from backend.app.schemas.health_profile import PatientCaseContext
from backend.app.schemas.profile import HealthProfileUpdate
from backend.app.utils.clerk_auth import get_current_user
from backend.app.utils.logger import logger

router = APIRouter(prefix="/profile", tags=["Health Profile"])


def _serialize_list(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, list):
        return json.dumps([str(x).strip() for x in val if str(x).strip()])
    return str(val)


def _parse_list(val: Any) -> List[str]:
    if not val:
        return []
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [s.strip() for s in str(val).split(",") if s.strip()]


def _is_profile_complete(profile: HealthProfile) -> bool:
    """Calculates if the profile has required clinical baseline fields."""
    has_dob = bool(profile.date_of_birth or profile.age is not None)
    has_sex = bool(profile.sex or profile.gender)
    has_blood = bool(profile.blood_group or profile.blood_type)
    return bool(has_dob and has_sex and has_blood)


def _build_profile_response(profile: Optional[HealthProfile], user_id: int) -> Dict[str, Any]:
    if not profile:
        return {
            "id": None,
            "user_id": user_id,
            "age": None,
            "gender": None,
            "sex": None,
            "date_of_birth": None,
            "height_cm": None,
            "weight_kg": None,
            "blood_type": None,
            "blood_group": None,
            "medical_conditions": [],
            "chronic_conditions": None,
            "medications": [],
            "current_medications": None,
            "allergies": [],
            "previous_surgeries": [],
            "family_history": [],
            "emergency_contact": None,
            "emergency_phone": None,
            "bmi": None,
            "bmi_category": None,
            "is_completed": False,
            "profile_completed": False,
            "created_at": None,
            "updated_at": None,
        }

    height = profile.height_cm
    weight = profile.weight_kg
    bmi, category = health_profile_service.calculate_bmi(height, weight)
    age = profile.age if profile.age is not None else health_profile_service.calculate_age(profile.date_of_birth)
    complete = _is_profile_complete(profile)

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
        "is_completed": complete,
        "profile_completed": complete,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@router.get("", response_model=Dict[str, Any])
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user's real electronic health profile from database."""
    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == current_user.id)
        .first()
    )
    return _build_profile_response(profile, user_id=current_user.id)


@router.put("", response_model=Dict[str, Any])
def update_user_profile(
    payload: HealthProfileUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the authenticated user's real health profile in Supabase."""
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

    # Synchronize aliases
    if "blood_group" in data and data["blood_group"]:
        profile.blood_type = data["blood_group"]
        profile.blood_group = data["blood_group"]
    elif "blood_type" in data and data["blood_type"]:
        profile.blood_group = data["blood_type"]
        profile.blood_type = data["blood_type"]

    if "sex" in data and data["sex"]:
        profile.gender = data["sex"]
        profile.sex = data["sex"]
    elif "gender" in data and data["gender"]:
        profile.sex = data["gender"]
        profile.gender = data["gender"]

    # Calculate age from DOB if supplied
    if profile.date_of_birth:
        calc_age = health_profile_service.calculate_age(profile.date_of_birth)
        if calc_age is not None:
            profile.age = calc_age

    profile.profile_completed = _is_profile_complete(profile)

    db.commit()
    db.refresh(profile)
    logger.info(f"Health profile updated for authenticated user #{current_user.id}")
    return _build_profile_response(profile, user_id=current_user.id)


@router.get("/clinical-context", response_model=PatientCaseContext)
def get_clinical_context(
    chief_complaint: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns selective privacy-conscious clinical context for the authenticated user."""
    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        return PatientCaseContext(
            age=None,
            sex=None,
            relevant_conditions=[],
            active_medications=[],
            critical_allergies=[],
        )

    dto = health_profile_service._to_response_dto(profile)
    return health_profile_service.get_selective_clinical_context(
        dto, chief_complaint=chief_complaint
    )
