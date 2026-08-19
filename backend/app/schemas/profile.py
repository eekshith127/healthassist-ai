import datetime
from typing import Optional, List, Union, Any
from pydantic import BaseModel, ConfigDict, Field


class HealthProfileBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[Union[List[str], str]] = None
    chronic_conditions: Optional[Union[List[str], str]] = None
    current_medications: Optional[Union[List[str], str]] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None

    date_of_birth: Optional[str] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_group: Optional[str] = None
    medical_conditions: Optional[Union[List[str], str]] = None
    medications: Optional[Union[List[str], str]] = None
    previous_surgeries: Optional[Union[List[str], str]] = None
    family_history: Optional[Union[List[str], str]] = None
    profile_completed: Optional[bool] = None


class HealthProfileCreate(HealthProfileBase):
    pass


class HealthProfileUpdate(HealthProfileBase):
    pass


class HealthProfileRead(HealthProfileBase):
    id: Optional[int] = None
    user_id: Optional[int] = None
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    is_completed: Optional[bool] = None
    profile_completed: Optional[bool] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")
