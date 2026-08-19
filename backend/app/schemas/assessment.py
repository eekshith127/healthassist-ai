import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AssessmentCreate(BaseModel):
    symptoms: str
    duration: Optional[str] = None
    severity: Optional[int] = None
    additional_notes: Optional[str] = None


class AssessmentRead(BaseModel):
    id: int
    user_id: int
    symptoms: str
    triage_level: str
    ai_summary: Optional[str] = None
    consensus_score: Optional[float] = None
    safety_checked: str
    recommended_specialist: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
