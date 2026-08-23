"""API Endpoints for Multi-LLM Medical Assessment."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.patient_case import PatientCaseModel
from backend.app.schemas.medical_assessment import (
    MultiModelAssessmentRequest,
    MultiModelAssessmentResponse,
)
from backend.app.ai.medical_assessor import medical_assessor
from backend.app.utils.clerk_auth import get_current_user, get_optional_current_user
from backend.app.utils.logger import logger

router = APIRouter(prefix="/assessment", tags=["Medical Assessment"])


@router.post("/multi-model", response_model=MultiModelAssessmentResponse)
async def run_multi_model_assessment(
    payload: MultiModelAssessmentRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Initiates concurrent Multi-LLM Medical Assessment on a normalized PatientCase.
    
    Model A, Model B, and Model C evaluate the case independently.
    Handles partial failures gracefully and records all outcomes transparently.
    """
    try:
        response = await medical_assessor.assess_case(
            patient_case=payload.patient_case,
            assessment_id=payload.assessment_id,
            db=db,
            save_to_db=payload.save_to_db or False,
        )
        return response
    except Exception as e:
        logger.exception(f"Error executing multi-model assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medical assessment coordinator failure: {str(e)}",
        )


@router.post("/cases/{case_id}/assess", response_model=MultiModelAssessmentResponse)
async def assess_saved_patient_case(
    case_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Executes Multi-LLM assessment directly on an existing saved PatientCase."""
    query = db.query(PatientCaseModel).filter(PatientCaseModel.id == case_id)
    if current_user is not None:
        query = query.filter(
            (PatientCaseModel.user_id == current_user.id) | (PatientCaseModel.user_id.is_(None))
        )
    case_record = query.first()

    if not case_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PatientCase #{case_id} not found.",
        )

    patient_case_schema = case_record.to_schema()

    response = await medical_assessor.assess_case(
        patient_case=patient_case_schema,
        assessment_id=case_record.assessment_id,
        db=db,
        save_to_db=True,
    )
    return response
