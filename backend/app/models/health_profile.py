import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime
from backend.app.database.session import Base


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False
    )
    date_of_birth = Column(String(50), nullable=True)  # Format: YYYY-MM-DD
    sex = Column(String(50), nullable=True)  # male, female, other
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    blood_group = Column(String(20), nullable=True)  # O+, O-, A+, A-, B+, B-, AB+, AB-
    medical_conditions = Column(Text, nullable=True)  # JSON-encoded string list of conditions
    medications = Column(Text, nullable=True)  # JSON-encoded string list of active medications
    allergies = Column(Text, nullable=True)  # JSON-encoded string list of allergies
    previous_surgeries = Column(Text, nullable=True)  # JSON-encoded string list of past surgeries
    family_history = Column(Text, nullable=True)  # JSON-encoded string list/dict of family conditions
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
