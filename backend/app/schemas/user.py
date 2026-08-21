import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    id: int
    clerk_user_id: str
    name: Optional[str] = None
    email: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class MeResponse(BaseModel):
    id: int
    clerk_user_id: str
    name: Optional[str] = None
    email: str
    profile_completed: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
