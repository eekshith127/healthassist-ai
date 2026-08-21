from sqlalchemy.orm import Session

from backend.app.models.health_profile import HealthProfile
from backend.app.repositories.health_profile_repository import HealthProfileRepository


class HealthProfileService:
    def __init__(self, db: Session):
        self.repository = HealthProfileRepository(db)

    def get(self, user_id: int) -> HealthProfile | None:
        return self.repository.get_for_user(user_id)

    def update(self, user_id: int, values: dict) -> HealthProfile:
        return self.repository.upsert(user_id, values)
