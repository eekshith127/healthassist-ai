import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False
    )
    date_of_birth = Column(String(50), nullable=True)  # Format: YYYY-MM-DD
    sex = Column(String(50), nullable=True)  # male, female, other
    gender = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    blood_group = Column(String(20), nullable=True)
    blood_type = Column(String(20), nullable=True)
    medical_conditions = Column(Text, nullable=True)  # JSON or comma-separated
    chronic_conditions = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    previous_surgeries = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    emergency_phone = Column(String(50), nullable=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    # Relationships
    user = relationship("User", back_populates="health_profile")

    @property
    def is_completed(self) -> bool:
        """Determines if essential medical profile information has been filled."""
        if self.profile_completed:
            return True
        return bool(
            (self.age is not None or self.date_of_birth)
            and (self.gender or self.sex)
            and (self.blood_type or self.blood_group)
        )
