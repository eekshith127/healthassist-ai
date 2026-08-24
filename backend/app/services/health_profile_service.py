import json
import datetime
from typing import Optional, Tuple, List, Any
from sqlalchemy.orm import Session
from backend.app.models.health_profile import HealthProfile
from backend.app.schemas.health_profile import (
    HealthProfileUpdate,
    HealthProfileResponse,
    PatientCaseContext,
)


class HealthProfileService:
    @staticmethod
    def calculate_bmi(
        height_cm: Optional[float], weight_kg: Optional[float]
    ) -> Tuple[Optional[float], Optional[str]]:
        """
        Calculates Body Mass Index (BMI) from height in cm and weight in kg.
        Returns (bmi_value, bmi_category).
        """
        if not height_cm or not weight_kg or height_cm <= 0 or weight_kg <= 0:
            return None, None

        height_m = height_cm / 100.0
        bmi_val = round(weight_kg / (height_m * height_m), 1)

        if bmi_val < 18.5:
            category = "Underweight"
        elif bmi_val < 25.0:
            category = "Normal weight"
        elif bmi_val < 30.0:
            category = "Overweight"
        else:
            category = "Obese"

        return bmi_val, category

    @staticmethod
    def calculate_age(dob_str: Optional[str]) -> Optional[int]:
        """
        Calculates current age from a date of birth string in YYYY-MM-DD format.
        """
        if not dob_str:
            return None
        try:
            clean_str = dob_str.strip().split("T")[0]
            dob = datetime.datetime.strptime(clean_str, "%Y-%m-%d").date()
            today = datetime.date.today()
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            return max(0, age)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _parse_json_list(raw_value: Optional[str]) -> List[str]:
        """Safely parses JSON list or comma-delimited strings."""
        if not raw_value:
            return []
        try:
            parsed = json.loads(raw_value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if item]
            elif isinstance(parsed, str):
                return [parsed.strip()]
            return []
        except Exception:
            return [item.strip() for item in raw_value.split(",") if item.strip()]

    @staticmethod
    def _dump_json_list(items: Optional[List[str]]) -> str:
        """Serializes list to JSON string."""
        if not items:
            return json.dumps([])
        clean = [str(item).strip() for item in items if str(item).strip()]
        return json.dumps(clean)

    @classmethod
    def _to_response_dto(cls, model: HealthProfile) -> HealthProfileResponse:
        """Converts SQLAlchemy model into enriched HealthProfileResponse."""
        bmi, category = cls.calculate_bmi(model.height_cm, model.weight_kg)
        age = model.age if model.age is not None else cls.calculate_age(model.date_of_birth)

        has_dob = bool(model.date_of_birth or model.age is not None)
        has_sex = bool(model.sex or model.gender)
        has_blood = bool(model.blood_group or model.blood_type)
        is_complete = bool(has_dob and has_sex and has_blood)

        return HealthProfileResponse(
            id=model.id,
            user_id=model.user_id,
            date_of_birth=model.date_of_birth,
            sex=model.sex or model.gender,
            height_cm=model.height_cm,
            weight_kg=model.weight_kg,
            blood_group=model.blood_group or model.blood_type,
            medical_conditions=cls._parse_json_list(model.medical_conditions or model.chronic_conditions),
            medications=cls._parse_json_list(model.medications or model.current_medications),
            allergies=cls._parse_json_list(model.allergies),
            previous_surgeries=cls._parse_json_list(model.previous_surgeries),
            family_history=cls._parse_json_list(model.family_history),
            emergency_contact=model.emergency_contact,
            emergency_phone=model.emergency_phone,
            bmi=bmi,
            bmi_category=category,
            age=age,
            profile_completed=is_complete,
            updated_at=model.updated_at,
        )

    @classmethod
    def get_or_create_profile(
        cls, db: Session, user_id: int
    ) -> HealthProfileResponse:
        """
        Retrieves the persistent HealthProfile for user_id.
        If none exists, initializes an empty profile record.
        """
        profile = (
            db.query(HealthProfile).filter(HealthProfile.user_id == user_id).first()
        )
        if not profile:
            profile = HealthProfile(
                user_id=user_id,
                profile_completed=False,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        return cls._to_response_dto(profile)

    @classmethod
    def update_profile(
        cls, db: Session, user_id: int, data: HealthProfileUpdate
    ) -> HealthProfileResponse:
        """
        Updates persistent HealthProfile for user_id with real data.
        """
        profile = (
            db.query(HealthProfile).filter(HealthProfile.user_id == user_id).first()
        )
        if not profile:
            profile = HealthProfile(user_id=user_id)
            db.add(profile)

        if data.date_of_birth is not None:
            profile.date_of_birth = data.date_of_birth
            calc_age = cls.calculate_age(data.date_of_birth)
            if calc_age is not None:
                profile.age = calc_age
        if data.sex is not None:
            profile.sex = data.sex.lower().strip() if data.sex else None
            profile.gender = data.sex
        if data.height_cm is not None:
            profile.height_cm = data.height_cm
        if data.weight_kg is not None:
            profile.weight_kg = data.weight_kg
        if data.blood_group is not None:
            profile.blood_group = data.blood_group
            profile.blood_type = data.blood_group
        if data.medical_conditions is not None:
            profile.medical_conditions = cls._dump_json_list(data.medical_conditions)
            profile.chronic_conditions = profile.medical_conditions
        if data.medications is not None:
            profile.medications = cls._dump_json_list(data.medications)
            profile.current_medications = profile.medications
        if data.allergies is not None:
            profile.allergies = cls._dump_json_list(data.allergies)
        if data.previous_surgeries is not None:
            profile.previous_surgeries = cls._dump_json_list(data.previous_surgeries)
        if data.family_history is not None:
            profile.family_history = cls._dump_json_list(data.family_history)
        if data.emergency_contact is not None:
            profile.emergency_contact = data.emergency_contact
        if data.emergency_phone is not None:
            profile.emergency_phone = data.emergency_phone

        has_dob = bool(profile.date_of_birth or profile.age is not None)
        has_sex = bool(profile.sex or profile.gender)
        has_blood = bool(profile.blood_group or profile.blood_type)
        profile.profile_completed = bool(has_dob and has_sex and has_blood)

        db.commit()
        db.refresh(profile)
        return cls._to_response_dto(profile)

    @classmethod
    def get_selective_clinical_context(
        cls, profile: HealthProfileResponse, chief_complaint: Optional[str] = None
    ) -> PatientCaseContext:
        """
        Extracts only clinically relevant context for symptom evaluation.
        """
        complaint_lower = (chief_complaint or "").lower()

        # Filter relevant conditions
        relevant_conditions = []
        for cond in profile.medical_conditions:
            cond_lower = cond.lower()
            if (
                any(w in complaint_lower for w in ["breath", "cough", "wheez", "chest"])
                and any(w in cond_lower for w in ["asthma", "copd", "bronch", "lung"])
            ):
                relevant_conditions.append(cond)
            elif (
                any(w in complaint_lower for w in ["dizzy", "headache", "chest", "heart"])
                and any(w in cond_lower for w in ["hypertension", "cardiac", "heart", "bp"])
            ):
                relevant_conditions.append(cond)
            elif (
                any(w in complaint_lower for w in ["thirst", "frequent", "sugar", "dizzy"])
                and any(w in cond_lower for w in ["diabet", "glucose"])
            ):
                relevant_conditions.append(cond)
            else:
                relevant_conditions.append(cond)

        return PatientCaseContext(
            age=profile.age,
            sex=profile.sex,
            bmi_category=profile.bmi_category,
            relevant_conditions=relevant_conditions[:5],
            active_medications=profile.medications[:5],
            critical_allergies=profile.allergies[:5],
        )


health_profile_service = HealthProfileService()
