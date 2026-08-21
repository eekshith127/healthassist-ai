from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.repositories.user_repository import UserRepository
from backend.app.utils.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    if not settings.CLERK_JWT_KEY:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Clerk verification is not configured")

    try:
        claims: dict[str, Any] = jwt.decode(
            credentials.credentials,
            settings.CLERK_JWT_KEY,
            algorithms=["RS256", "HS256"],
            issuer=settings.CLERK_ISSUER or None,
            options={"verify_aud": False},
        )
        clerk_user_id = claims["sub"]
    except (jwt.PyJWTError, KeyError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Clerk token")

    user = UserRepository(db).get_by_clerk_id(clerk_user_id)
    if user is None:
        email = claims.get("email") or claims.get("email_address") or f"{clerk_user_id}@clerk.local"
        user = UserRepository(db).get_or_create(clerk_user_id, email, claims.get("name"))
    return user
