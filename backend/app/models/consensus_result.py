import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from backend.app.database.session import Base


class ConsensusResult(Base):
    __tablename__ = "consensus_results"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, unique=True)
    result = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    assessment = relationship("Assessment", back_populates="consensus_result")