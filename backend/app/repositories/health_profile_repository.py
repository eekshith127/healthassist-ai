from sqlalchemy.orm import Session

from backend.app.models.health_profile import HealthProfile


class HealthProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_for_user(self, user_id: int) -> HealthProfile | None:
        return self.db.query(HealthProfile).filter(HealthProfile.user_id == user_id).first()

    def upsert(self, user_id: int, values: dict) -> HealthProfile:
        profile = self.get_for_user(user_id)
        if profile is None:
            profile = HealthProfile(user_id=user_id, **values)
            self.db.add(profile)
        else:
            for field, value in values.items():
                setattr(profile, field, value)
        self.db.commit()
        self.db.refresh(profile)
        return profile
