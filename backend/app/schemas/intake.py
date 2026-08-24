"""Pydantic schemas for the Conversational Intake AI and Patient Case extraction."""

from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.health_profile import PatientCaseContext


class PatientCase(BaseModel):
    """Structured patient clinical intake case data."""
    main_complaint: str = Field(
        default="",
        description="The primary symptom or medical concern reported by the patient."
    )
    symptoms: List[str] = Field(
        default_factory=list,
        description="List of all specific symptoms reported by the patient."
    )
    duration: Optional[str] = Field(
        default=None,
        description="How long the patient has been experiencing the symptoms (e.g., '2 days', '3 hours')."
    )
    severity: Optional[Union[int, str]] = Field(
        default=None,
        description="Severity or pain rating, preferably on a 1-10 numerical scale or descriptive string."
    )
    onset: Optional[str] = Field(
        default="",
        description="Onset characteristics (e.g., 'gradual', 'sudden', 'after physical activity')."
    )
    associated_symptoms: List[str] = Field(
        default_factory=list,
        description="Secondary or concurrent symptoms (e.g., nausea, photophobia, chills)."
    )
    red_flags: List[str] = Field(
        default_factory=list,
        description="Identified red-flag symptoms requiring emergency triage attention (e.g., dyspnea, severe chest pain)."
    )

    def to_minimized_payload(self) -> Dict[str, Any]:
        """Returns anonymized, strictly data-minimized payload for external LLM evaluation."""
        return {
            "main_complaint": self.main_complaint,
            "symptoms": self.symptoms,
            "duration": self.duration,
            "severity": self.severity,
            "onset": self.onset,
            "associated_symptoms": self.associated_symptoms,
            "red_flags": self.red_flags,
        }

    model_config = ConfigDict(from_attributes=True)


class IntakeOutput(BaseModel):
    """Standardized output produced by the Conversational Intake AI."""
    assistant_message: str = Field(
        ...,
        description="Empathetic, clear clinical intake response or follow-up questions (1-2 questions maximum)."
    )
    information_complete: bool = Field(
        default=False,
        description="True if sufficient essential intake details have been gathered, False if follow-up is needed."
    )
    patient_case: PatientCase = Field(
        default_factory=PatientCase,
        description="Current extracted state of the patient case."
    )
    options: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Dynamic symptom-relevant quick response options for the user."
    )

    model_config = ConfigDict(from_attributes=True)


class IntakeConversationTurn(BaseModel):
    """A single turn in the intake dialogue."""
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str = Field(..., description="The message content of the turn.")


class IntakeMessageRequest(BaseModel):
    """API payload for sending a user message into the Intake AI agent."""
    message: str = Field(..., description="The latest user input text.")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default_factory=list,
        description="List of previous conversation turns formatted as [{'role': '...', 'content': '...'}]"
    )
    health_profile: Optional[PatientCaseContext] = Field(
        default=None,
        description="Persistent patient health context (e.g. chronic conditions, allergies, current medications)."
    )
    current_case: Optional[PatientCase] = Field(
        default=None,
        description="Previously extracted patient case state to build upon."
    )
    assessment_id: Optional[Union[str, int]] = Field(
        default=None,
        description="Optional session or assessment identifier."
    )


class IntakeMessageResponse(BaseModel):
    """API response from the Intake AI endpoint."""
    assistant_message: str
    information_complete: bool
    patient_case: PatientCase
    options: Optional[List[Dict[str, str]]] = None
    saved_case_id: Optional[int] = None
    status: str = "success"
