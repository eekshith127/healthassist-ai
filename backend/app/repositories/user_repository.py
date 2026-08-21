from sqlalchemy.orm import Session

from backend.app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_clerk_id(self, clerk_user_id: str) -> User | None:
        return self.db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    def get_or_create(self, clerk_user_id: str, email: str, full_name: str | None) -> User:
        user = self.get_by_clerk_id(clerk_user_id)
        if user is None:
            user = User(clerk_user_id=clerk_user_id, email=email, full_name=full_name)
            self.db.add(user)
        else:
            user.email = email
            user.full_name = full_name or user.full_name
        self.db.commit()
        self.db.refresh(user)
        return user
