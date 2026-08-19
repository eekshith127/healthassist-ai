from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.assessment import Assessment
from backend.app.schemas.assessment import AssessmentCreate, AssessmentRead
from backend.app.utils.clerk_auth import get_current_user
from backend.app.utils.logger import logger

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.get("", response_model=List[AssessmentRead])
def get_user_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns only the clinical assessments belonging to the authenticated user."""
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
    return assessments


@router.post("", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED)
def create_user_assessment(
    payload: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates an assessment record strictly associated with the authenticated user."""
    assessment = Assessment(
        user_id=current_user.id,
        symptoms=payload.symptoms,
        duration=payload.duration,
        severity=payload.severity,
        triage_level=payload.triage_level or "non-urgent",
        ai_summary=payload.ai_summary,
        consensus_score=payload.consensus_score,
        safety_checked=payload.safety_checked or "passed",
        recommended_specialist=payload.recommended_specialist,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    logger.info(f"New assessment #{assessment.id} created for user #{current_user.id}")
    return assessment


@router.get("/{assessment_id}", response_model=AssessmentRead)
def get_single_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns a specific assessment only if it belongs to the authenticated user.

    Returns 404 to avoid leaking whether another user's assessment ID exists.
    """
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.user_id == current_user.id,
        )
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment record not found.",
        )

    return assessment
