from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.assessment import AssessmentCreate, AssessmentRead
from backend.app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/assessment", tags=["Assessment"])


@router.post("/evaluate", response_model=AssessmentRead)
def evaluate_symptoms(
    payload: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AssessmentService(db).create(current_user.id, payload.symptoms, payload.additional_notes)


@router.get("", response_model=list[AssessmentRead])
def list_assessments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AssessmentService(db).list_for_user(current_user.id)
