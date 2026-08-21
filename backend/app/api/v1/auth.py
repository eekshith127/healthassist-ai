from fastapi import APIRouter, Depends

from backend.app.api.dependencies import get_current_user
from backend.app.models.user import User
from backend.app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/sync", response_model=UserRead)
def sync_user(current_user: User = Depends(get_current_user)):
    return current_user
