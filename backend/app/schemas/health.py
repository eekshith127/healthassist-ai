import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str
    service: Optional[str] = "HealthAssist API"
    version: Optional[str] = "0.1.0"
    environment: Optional[str] = "development"
    database: Optional[str] = "connected"


class HealthProfileUpdate(BaseModel):
    age: int | None = None
    gender: str | None = None
    blood_type: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    current_medications: str | None = None
    emergency_contact: str | None = None


class HealthProfileRead(HealthProfileUpdate):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime | None = None

    model_config = ConfigDict(from_attributes=True)
