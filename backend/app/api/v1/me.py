from fastapi import APIRouter, Depends
from backend.app.models.user import User
from backend.app.schemas.user import MeResponse
from backend.app.utils.clerk_auth import get_current_user

router = APIRouter(tags=["User"])


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the currently authenticated HealthAssist user and profile completion status."""
    profile_completed = bool(
        current_user.health_profile and current_user.health_profile.is_completed
    )

    return MeResponse(
        id=current_user.id,
        clerk_user_id=current_user.clerk_user_id,
        name=current_user.name,
        email=current_user.email,
        profile_completed=profile_completed,
        created_at=current_user.created_at,
    )
