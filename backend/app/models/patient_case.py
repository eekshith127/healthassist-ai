import datetime
import json
from typing import List, Optional, Any, Dict
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base
from backend.app.schemas.intake import PatientCase as PatientCaseSchema


class PatientCase(Base):
    """SQLAlchemy model for storing final clinical intake cases."""
    __tablename__ = "patient_cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assessment_id = Column(String(100), nullable=True, index=True)

    status = Column(String(30), default="open", nullable=False)
    notes = Column(Text, nullable=True)

    main_complaint = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)  # JSON-serialized list of symptoms
    duration = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    onset = Column(String(255), nullable=True)
    associated_symptoms = Column(Text, nullable=True)  # JSON-serialized list
    red_flags = Column(Text, nullable=True)  # JSON-serialized list
    information_complete = Column(Boolean, default=True)
    raw_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    # Relationships
    user = relationship("User", back_populates="patient_cases", foreign_keys=[user_id])
    patient = relationship("User", foreign_keys=[user_id], overlaps="patient_cases,user")
    assessment = relationship(
        "Assessment",
        back_populates="patient_case",
        primaryjoin="foreign(PatientCase.assessment_id) == cast(Assessment.id, String)",
    )
    chat_messages = relationship("ChatMessage", back_populates="patient_case")

    def to_schema(self) -> PatientCaseSchema:
        """Convert database record to PatientCase Pydantic schema."""
        def safe_json_loads(val: Optional[str]) -> List[str]:
            if not val:
                return []
            try:
                parsed = json.loads(val)
                return parsed if isinstance(parsed, list) else [str(parsed)]
            except Exception:
                return [s.strip() for s in val.split(",") if s.strip()]

        # Parse severity safely (int or str)
        parsed_severity = None
        if self.severity is not None:
            try:
                parsed_severity = int(self.severity)
            except (ValueError, TypeError):
                parsed_severity = self.severity

        return PatientCaseSchema(
            main_complaint=self.main_complaint or "",
            symptoms=safe_json_loads(self.symptoms),
            duration=self.duration,
            severity=parsed_severity,
            onset=self.onset or "",
            associated_symptoms=safe_json_loads(self.associated_symptoms),
            red_flags=safe_json_loads(self.red_flags),
        )

    @classmethod
    def from_schema(
        cls,
        schema: PatientCaseSchema,
        user_id: Optional[int] = None,
        assessment_id: Optional[Any] = None,
        information_complete: bool = True,
    ) -> "PatientCase":
        """Instantiate model from a PatientCase Pydantic schema."""
        return cls(
            user_id=user_id,
            assessment_id=str(assessment_id) if assessment_id is not None else None,
            main_complaint=schema.main_complaint,
            symptoms=json.dumps(schema.symptoms),
            duration=schema.duration,
            severity=str(schema.severity) if schema.severity is not None else None,
            onset=schema.onset,
            associated_symptoms=json.dumps(schema.associated_symptoms),
            red_flags=json.dumps(schema.red_flags),
            information_complete=information_complete,
            raw_json=json.dumps(schema.model_dump()),
        )


# Alias for backward compatibility
PatientCaseModel = PatientCase
