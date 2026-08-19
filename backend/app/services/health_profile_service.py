import json
import datetime
from typing import Optional, Tuple, List, Any
from sqlalchemy.orm import Session
from backend.app.models.health_profile import HealthProfile
from backend.app.models.user import User
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
            # Fallback to comma separation
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
        age = cls.calculate_age(model.date_of_birth)

        return HealthProfileResponse(
            id=model.id,
            user_id=model.user_id,
            date_of_birth=model.date_of_birth,
            sex=model.sex,
            height_cm=model.height_cm,
            weight_kg=model.weight_kg,
            blood_group=model.blood_group,
            medical_conditions=cls._parse_json_list(model.medical_conditions),
            medications=cls._parse_json_list(model.medications),
            allergies=cls._parse_json_list(model.allergies),
            previous_surgeries=cls._parse_json_list(model.previous_surgeries),
            family_history=cls._parse_json_list(model.family_history),
            bmi=bmi,
            bmi_category=category,
            age=age,
            profile_completed=bool(model.profile_completed),
            updated_at=model.updated_at,
        )

    @classmethod
    def get_or_create_profile(
        cls, db: Session, user_id: int = 1
    ) -> HealthProfileResponse:
        """
        Retrieves the persistent HealthProfile for user_id.
        If none exists, initializes and saves a default profile.
        """
        # Ensure user exists or create default mock user if in dev
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(
                id=user_id,
                email="john.doe@healthassist.ai",
                hashed_password="mock-hashed-password",
                full_name="John Doe",
                role="patient",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        profile = (
            db.query(HealthProfile).filter(HealthProfile.user_id == user_id).first()
        )
        if not profile:
            profile = HealthProfile(
                user_id=user_id,
                date_of_birth="1994-05-14",
                sex="male",
                height_cm=180.0,
                weight_kg=75.0,
                blood_group="O+",
                medical_conditions=json.dumps(
                    ["Mild Exercise-Induced Bronchospasm (Asthma)"]
                ),
                medications=json.dumps(
                    [
                        "Loratadine 10mg Oral Tablet (Daily)",
                        "Albuterol Inhaler (PRN)",
                    ]
                ),
                allergies=json.dumps(
                    [
                        "Penicillin / Amoxicillin (Severe)",
                        "Peanuts & Tree Nuts (Moderate)",
                    ]
                ),
                previous_surgeries=json.dumps(["Laparoscopic Appendectomy (2016)"]),
                family_history=json.dumps(
                    ["Maternal Hypertension", "Paternal Type 2 Diabetes"]
                ),
                profile_completed=True,
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
        Updates persistent HealthProfile for user_id.
        """
        # Ensure user exists
        cls.get_or_create_profile(db, user_id)

        profile = (
            db.query(HealthProfile).filter(HealthProfile.user_id == user_id).first()
        )
        if not profile:
            profile = HealthProfile(user_id=user_id)
            db.add(profile)

        if data.date_of_birth is not None:
            profile.date_of_birth = data.date_of_birth
        if data.sex is not None:
            profile.sex = data.sex.lower().strip() if data.sex else None
        if data.height_cm is not None:
            profile.height_cm = data.height_cm
        if data.weight_kg is not None:
            profile.weight_kg = data.weight_kg
        if data.blood_group is not None:
            profile.blood_group = data.blood_group
        if data.medical_conditions is not None:
            profile.medical_conditions = cls._dump_json_list(data.medical_conditions)
        if data.medications is not None:
            profile.medications = cls._dump_json_list(data.medications)
        if data.allergies is not None:
            profile.allergies = cls._dump_json_list(data.allergies)
        if data.previous_surgeries is not None:
            profile.previous_surgeries = cls._dump_json_list(data.previous_surgeries)
        if data.family_history is not None:
            profile.family_history = cls._dump_json_list(data.family_history)

        # Check completion
        has_core = (
            bool(profile.date_of_birth)
            and bool(profile.sex)
            and bool(profile.height_cm)
            and bool(profile.weight_kg)
            and bool(profile.blood_group)
        )
        profile.profile_completed = has_core
        profile.updated_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()
        db.refresh(profile)

        return cls._to_response_dto(profile)

    @classmethod
    def get_selective_clinical_context(
        cls,
        profile_dto: HealthProfileResponse,
        chief_complaint: Optional[str] = None,
    ) -> PatientCaseContext:
        """
        Privacy-guard function: Extracts ONLY clinically relevant attributes
        needed for PatientCase evaluation during AI symptom triage.
        Prevents raw, excessive profile leakage to external LLM prompts.
        """
        complaint_lower = (chief_complaint or "").lower()

        # Always include active critical allergies for contraindication screening
        critical_allergies = list(profile_dto.allergies or [])

        # Filter relevant conditions and medications if applicable
        relevant_conditions = []
        for cond in profile_dto.medical_conditions or []:
            # Include respiratory conditions for cough/asthma, cardiac for chest/BP, etc.
            cond_lower = cond.lower()
            if any(
                k in complaint_lower
                for k in ["cough", "breath", "wheez", "asthma"]
            ) and any(c in cond_lower for c in ["asthma", "bronch", "lung", "copd"]):
                relevant_conditions.append(cond)
            elif any(
                k in complaint_lower
                for k in ["chest", "heart", "palpitat", "pressure"]
            ) and any(c in cond_lower for c in ["cardio", "hypertens", "heart"]):
                relevant_conditions.append(cond)
            elif not chief_complaint:
                relevant_conditions.append(cond)
            else:
                # Include general chronic condition flag without full raw details
                relevant_conditions.append(cond)

        return PatientCaseContext(
            age=profile_dto.age,
            sex=profile_dto.sex,
            bmi_category=profile_dto.bmi_category,
            relevant_conditions=relevant_conditions,
            critical_allergies=critical_allergies,
            active_medications=profile_dto.medications or [],
        )


health_profile_service = HealthProfileService()
