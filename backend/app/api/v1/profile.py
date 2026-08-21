from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.health import HealthProfileRead, HealthProfileUpdate
from backend.app.services.health_profile_service import HealthProfileService

router = APIRouter(prefix="/profile", tags=["Health Profile"])


@router.get("", response_model=HealthProfileRead)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = HealthProfileService(db).get(current_user.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Health profile not found")
    return profile


@router.put("", response_model=HealthProfileRead)
def update_profile(
    payload: HealthProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return HealthProfileService(db).update(current_user.id, payload.model_dump(exclude_unset=True))