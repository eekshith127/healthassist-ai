import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class HealthCardShareResponse(BaseModel):
    token: Optional[str] = None
    is_active: bool = False
    created_at: Optional[datetime.datetime] = None
    expires_at: Optional[datetime.datetime] = None
    revoked_at: Optional[datetime.datetime] = None
    qr_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RevokeShareResponse(BaseModel):
    message: str
    revoked: bool


class PublicHealthCardResponse(BaseModel):
    """
    Strictly sanitized, privacy-preserving public health record intended
    exclusively for emergency first-responders and clinical triage.
    Excludes all internal user IDs, authentication tokens, email addresses,
    and private AI consultation/chat histories.
    """
    patient_name: str = "Patient"
    patient_identifier: str = "HA-EHR"
    age: Optional[int] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    medical_conditions: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_phone_dial: Optional[str] = None

    # Indian Emergency Hotlines
    national_emergency_dispatch: str = "112"
    national_emergency_dispatch_dial: str = "tel:112"
    poison_control_centre: str = "1800-116-117"
    poison_control_centre_dial: str = "tel:1800116117"
    poison_control_name: str = "AIIMS National Poisons Information Centre"

    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    disclaimer: str = (
        "This digital health card contains user-provided health information and is "
        "intended for health-awareness and emergency reference purposes. It is not a medical diagnosis."
    )
