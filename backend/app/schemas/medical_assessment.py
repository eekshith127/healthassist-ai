"""Schemas for the Multi-LLM Medical Assessment Module.

Defines standardized data contracts for multi-model concurrent evaluations of
patient cases. All models return possible conditions with assessment relevance
scores, supporting/contradicting factors, and missing information.

IMPORTANT CLINICAL CONSTRAINTS:
- Outputs represent possible conditions, NOT definitive diagnoses.
- Model-generated scores represent assessment relevance weights, NOT clinical probabilities.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.intake import PatientCase


class PossibleCondition(BaseModel):
    """A possible medical condition evaluated by an individual LLM model."""
    name: str = Field(
        ...,
        description="Name of the possible clinical condition (e.g., 'Acute Viral Bronchitis')."
    )
    assessment_score: Union[int, float] = Field(
        ...,
        description="Model-generated assessment relevance score (0-100 or 0-10). NOTE: Does NOT represent clinical probability."
    )
    supporting_factors: List[str] = Field(
        default_factory=list,
        description="Patient symptoms, onset, or clinical factors that support this condition."
    )
    contradicting_factors: List[str] = Field(
        default_factory=list,
        description="Factors from the case that make this condition less likely or atypical."
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="Clinical tests, physical exams, or history details that would help confirm/rule out this condition."
    )

    model_config = ConfigDict(from_attributes=True)


class ModelAssessmentOutput(BaseModel):
    """The normalized response structure returned independently by each LLM model."""
    possible_conditions: List[PossibleCondition] = Field(
        default_factory=list,
        description="List of possible conditions identified by this model."
    )
    severity: str = Field(
        ...,
        description="Estimated clinical severity (e.g., 'mild', 'moderate', 'severe', 'critical')."
    )
    red_flags: List[str] = Field(
        default_factory=list,
        description="Emergency or urgent red-flag symptoms identified by this model."
    )
    recommended_specialty: str = Field(
        ...,
        description="Recommended clinical specialty for referral (e.g., 'Pulmonology', 'Cardiology', 'Primary Care')."
    )

    model_config = ConfigDict(from_attributes=True)


class IndividualModelResult(BaseModel):
    """Internal and backend metadata container for an individual model's execution."""
    model_id: str = Field(..., description="Configured model identifier (e.g., 'model_a', 'model_b', 'model_c').")
    model_name: str = Field(..., description="Provider model name (e.g., 'gemini-1.5-flash', 'gpt-4o-mini').")
    provider: str = Field(..., description="Provider type (e.g., 'gemini', 'openai', 'anthropic', 'mock').")
    status: str = Field(..., description="'success' or 'failed'.")
    assessment: Optional[ModelAssessmentOutput] = Field(
        default=None,
        description="Standardized assessment output if execution succeeded."
    )
    raw_output: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Raw JSON or payload from provider, stored securely in backend."
    )
    error_type: Optional[str] = Field(
        default=None,
        description="Error classification if failed (e.g., 'timeout', 'rate_limit', 'invalid_json', 'provider_error')."
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Sanitized failure description."
    )
    latency_ms: Optional[float] = Field(
        default=None,
        description="Response time in milliseconds."
    )

    model_config = ConfigDict(from_attributes=True)


class ModelFailureRecord(BaseModel):
    """Summary of a model failure for API response transparency."""
    model_id: str
    model_name: str
    provider: str
    error_type: str
    error_message: str


class MultiModelAssessmentRequest(BaseModel):
    """Request payload to initiate a multi-LLM assessment."""
    patient_case: PatientCase = Field(
        ...,
        description="The normalized PatientCase to be evaluated concurrently by all models."
    )
    assessment_id: Optional[Union[int, str]] = Field(
        default=None,
        description="Optional assessment or session ID to associate results with."
    )
    save_to_db: Optional[bool] = Field(
        default=False,
        description="Whether to persist raw model assessments into the database."
    )


class MultiModelAssessmentResponse(BaseModel):
    """Consolidated response returned by the multi-model assessment coordinator."""
    patient_case: PatientCase = Field(..., description="The normalized PatientCase evaluated.")
    assessments: Dict[str, ModelAssessmentOutput] = Field(
        default_factory=dict,
        description="Map of model_id to successful ModelAssessmentOutput."
    )
    failures: Dict[str, ModelFailureRecord] = Field(
        default_factory=dict,
        description="Map of model_id to failure details if any model encounters an error."
    )
    successful_models_count: int = Field(..., description="Number of models that completed successfully.")
    total_models_count: int = Field(..., description="Total number of models queried.")
    status: str = Field(default="completed", description="'completed', 'partial_success', or 'failed'.")
    disclaimer: str = Field(
        default=(
            "CLINICAL DISCLAIMER: These are possible conditions generated by AI models for clinical decision support, "
            "not definitive medical diagnoses. Model scores represent assessment relevance indicators and must not be "
            "interpreted as clinical probabilities. Always consult a licensed healthcare professional."
        ),
        description="Medical disclaimer regarding non-diagnostic nature of outputs."
    )
    timestamp: str = Field(..., description="UTC timestamp of assessment completion.")

    model_config = ConfigDict(from_attributes=True)
