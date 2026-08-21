import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    # Relationships
    health_profile = relationship(
        "HealthProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    assessments = relationship(
        "Assessment", back_populates="user", cascade="all, delete-orphan"
    )
    patient_cases = relationship(
        "PatientCase", back_populates="user", cascade="all, delete-orphan", foreign_keys="PatientCase.user_id"
    )
