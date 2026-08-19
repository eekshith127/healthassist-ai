import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class HealthProfileBase(BaseModel):
    date_of_birth: Optional[str] = Field(
        None, description="Date of birth in YYYY-MM-DD format"
    )
    sex: Optional[str] = Field(
        None, description="Biological sex: male, female, or other"
    )
    height_cm: Optional[float] = Field(
        None, ge=30.0, le=300.0, description="Height in centimeters"
    )
    weight_kg: Optional[float] = Field(
        None, ge=2.0, le=500.0, description="Weight in kilograms"
    )
    blood_group: Optional[str] = Field(
        None, description="Blood group: e.g. O+, O-, A+, A-, B+, B-, AB+, AB-"
    )
    medical_conditions: Optional[List[str]] = Field(
        default_factory=list, description="List of chronic medical conditions"
    )
    medications: Optional[List[str]] = Field(
        default_factory=list, description="List of active medications and dosages"
    )
    allergies: Optional[List[str]] = Field(
        default_factory=list, description="List of known allergies and sensitivities"
    )
    previous_surgeries: Optional[List[str]] = Field(
        default_factory=list, description="List of past surgical operations"
    )
    family_history: Optional[List[str]] = Field(
        default_factory=list, description="List of notable hereditary/family conditions"
    )

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        valid_groups = {"O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "UNKNOWN"}
        clean = v.strip().upper()
        if clean in valid_groups:
            return clean
        return v


class HealthProfileCreate(HealthProfileBase):
    pass


class HealthProfileUpdate(HealthProfileBase):
    pass


class HealthProfileResponse(HealthProfileBase):
    id: int
    user_id: int
    bmi: Optional[float] = Field(
        None, description="Calculated Body Mass Index (weight_kg / (height_m^2))"
    )
    bmi_category: Optional[str] = Field(
        None, description="BMI Classification (Underweight, Normal, Overweight, Obese)"
    )
    age: Optional[int] = Field(
        None, description="Derived current age calculated from date_of_birth"
    )
    profile_completed: bool = Field(
        False, description="Whether core biometric and health profile fields are completed"
    )
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class PatientCaseContext(BaseModel):
    """
    Privacy-conscious filtered context extracted from the persistent HealthProfile.
    Only relevant medical factors (e.g. allergies, specific contraindications)
    are forwarded to LLM reasoning during clinical triage.
    """
    age: Optional[int] = None
    sex: Optional[str] = None
    bmi_category: Optional[str] = None
    relevant_conditions: List[str] = Field(default_factory=list)
    critical_allergies: List[str] = Field(default_factory=list)
    active_medications: List[str] = Field(default_factory=list)
    privacy_notice: str = (
        "Filtered minimal clinical context extracted per HIPAA minimization standard."
    )
