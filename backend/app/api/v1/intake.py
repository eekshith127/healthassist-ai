"""Intake AI API Endpoints for conversational clinical assessment intake."""

from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.patient_case import PatientCaseModel
from backend.app.schemas.intake import (
    PatientCase,
    IntakeOutput,
    IntakeMessageRequest,
    IntakeMessageResponse,
)
from backend.app.schemas.health_profile import PatientCaseContext
from backend.app.services.health_profile_service import health_profile_service
from backend.app.ai.intake_agent import intake_agent
from backend.app.utils.clerk_auth import get_current_user, get_optional_current_user
from backend.app.utils.logger import logger

router = APIRouter(prefix="/intake", tags=["Intake AI"])


@router.post("/message", response_model=IntakeMessageResponse)
async def process_intake_message(
    payload: IntakeMessageRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Processes multi-turn patient messages through the Conversational Intake AI.

    Gathers symptoms, duration, severity, onset, and red flags.
    Integrates persistent health profile context when available.
    Persists finalized PatientCase when information_complete=True.
    """
    user_id = current_user.id if current_user else None

    # Retrieve persistent health profile context if not explicitly provided in payload
    health_context = payload.health_profile
    if health_context is None and current_user is not None:
        try:
            health_context = health_profile_service.get_patient_case_context(
                user_id=current_user.id,
                db=db,
                chief_complaint=payload.message,
            )
        except Exception as e:
            logger.debug(f"Could not load persistent health profile: {e}")

    # Process conversational turn through Intake AI agent
    intake_result: IntakeOutput = await intake_agent.process_turn(
        user_message=payload.message,
        conversation_history=payload.conversation_history,
        health_profile=health_context,
        current_case=payload.current_case,
        db=db,
        user_id=user_id,
        assessment_id=payload.assessment_id,
    )

    # Check if a case was saved in this turn
    saved_case_id = None
    if intake_result.information_complete:
        # Locate the most recently saved case for this user/assessment
        query = db.query(PatientCaseModel)
        if user_id:
            query = query.filter(PatientCaseModel.user_id == user_id)
        if payload.assessment_id:
            query = query.filter(PatientCaseModel.assessment_id == str(payload.assessment_id))
        latest_saved = query.order_by(PatientCaseModel.created_at.desc()).first()
        if latest_saved:
            saved_case_id = latest_saved.id

    return IntakeMessageResponse(
        assistant_message=intake_result.assistant_message,
        information_complete=intake_result.information_complete,
        patient_case=intake_result.patient_case,
        saved_case_id=saved_case_id,
        status="success",
    )


@router.get("/cases", response_model=List[PatientCase])
def get_user_patient_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves all saved PatientCase records for the authenticated user."""
    cases = (
        db.query(PatientCaseModel)
        .filter(PatientCaseModel.user_id == current_user.id)
        .order_by(PatientCaseModel.created_at.desc())
        .all()
    )
    return [c.to_schema() for c in cases]


@router.get("/cases/{case_id}", response_model=PatientCase)
def get_single_patient_case(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a single PatientCase record belonging to the authenticated user."""
    case = (
        db.query(PatientCaseModel)
        .filter(
            PatientCaseModel.id == case_id,
            PatientCaseModel.user_id == current_user.id,
        )
        .first()
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PatientCase record not found",
        )
    return case.to_schema()
