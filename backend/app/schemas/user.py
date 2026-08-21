import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "patient"


class UserCreate(UserBase):
    clerk_user_id: str


class UserRead(UserBase):
    id: int
    clerk_user_id: str
    is_active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
