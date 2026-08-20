import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, ConfigDict


class AssessmentCreate(BaseModel):
    symptoms: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    triage_level: Optional[str] = "non-urgent"
    ai_summary: Optional[str] = None
    consensus_score: Optional[float] = None
    safety_checked: Optional[str] = "passed"
    recommended_specialist: Optional[str] = None


class AssessmentRead(BaseModel):
    id: int
    user_id: int
    symptoms: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    triage_level: str
    ai_summary: Optional[str] = None
    consensus_score: Optional[float] = None
    safety_checked: str
    recommended_specialist: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ChatOptionSchema(BaseModel):
    id: str
    label: str
    value: str


class AssessmentMessageRequest(BaseModel):
    message: str
    sender: Optional[str] = "user"
    step: Optional[int] = 0
    duration: Optional[str] = None
    severity: Optional[str] = None


class AssessmentMessageResponse(BaseModel):
    id: str
    assessment_id: Union[int, str]
    sender: str = "bot"
    message: str
    timestamp: str
    step: int
    options: Optional[List[ChatOptionSchema]] = None
    assessment_summary: Optional[Dict[str, Any]] = None
    status: str = "success"

