from sqlalchemy.orm import Session

from backend.app.models.assessment import Assessment
from backend.app.repositories.assessment_repository import AssessmentRepository


class AssessmentService:
    def __init__(self, db: Session):
        self.repository = AssessmentRepository(db)

    def create(self, user_id: int, symptoms: str, notes: str | None = None) -> Assessment:
        return self.repository.create(user_id, symptoms, notes)

    def list_for_user(self, user_id: int) -> list[Assessment]:
        return self.repository.list_for_user(user_id)
