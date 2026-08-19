import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symptoms = Column(Text, nullable=False)
    duration = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    triage_level = Column(
        String(50), default="non-urgent"
    )  # emergency, urgent, non-urgent, self-care
    ai_summary = Column(Text, nullable=True)
    consensus_score = Column(Float, nullable=True)
    safety_checked = Column(String(50), default="passed")
    recommended_specialist = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="assessments")
