import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from backend.app.database.session import Base


class FinalAssessment(Base):
    __tablename__ = "final_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, unique=True)
    summary = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    assessment = relationship("Assessment", back_populates="final_assessment")