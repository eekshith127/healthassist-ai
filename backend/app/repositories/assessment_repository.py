from sqlalchemy.orm import Session

from backend.app.models.assessment import Assessment


class AssessmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, symptoms: str, notes: str | None = None) -> Assessment:
        assessment = Assessment(user_id=user_id, symptoms=symptoms, ai_summary=notes)
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def list_for_user(self, user_id: int) -> list[Assessment]:
        return (
            self.db.query(Assessment)
            .filter(Assessment.user_id == user_id)
            .order_by(Assessment.created_at.desc())
            .all()
        )
