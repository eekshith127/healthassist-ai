from fastapi import APIRouter, Depends
from backend.app.models.user import User
from backend.app.schemas.user import MeResponse
from backend.app.utils.clerk_auth import get_current_user

router = APIRouter(tags=["User"])


def _is_profile_complete(user: User) -> bool:
    """Calculates if the user's health profile has required clinical fields in database."""
    if not user.health_profile:
        return False
    hp = user.health_profile
    has_dob = bool(hp.date_of_birth or hp.age is not None)
    has_sex = bool(hp.sex or hp.gender)
    has_blood = bool(hp.blood_group or hp.blood_type)
    return bool(has_dob and has_sex and has_blood)


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the currently authenticated HealthAssist user and real profile completion status."""
    return MeResponse(
        id=current_user.id,
        clerk_user_id=current_user.clerk_user_id,
        name=current_user.name,
        email=current_user.email,
        profile_completed=_is_profile_complete(current_user),
        created_at=current_user.created_at,
    )


@router.get("/auth/me", response_model=MeResponse)
def get_auth_me(current_user: User = Depends(get_current_user)):
    """Alias for /me endpoint to support auth/me client standard."""
    return get_me(current_user=current_user)
