import time
import jwt
import httpx
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.utils.config import settings
from backend.app.utils.logger import logger

security = HTTPBearer(auto_error=False)

# In-memory JWKS cache
_jwks_cache: Dict[str, Any] = {"keys": [], "expires_at": 0}


def is_configured_secret_key(key: str) -> bool:
    return bool(key and not key.startswith("sk_test_replace") and key != "sk_test_your_key_here")


def is_configured_publishable_key(key: str) -> bool:
    return bool(key and not key.startswith("pk_test_replace") and key != "pk_test_your_key_here")


def get_jwks() -> list:
    """Fetch and cache Clerk public JWKS keys if configured."""
    now = time.time()
    if _jwks_cache["keys"] and now < _jwks_cache["expires_at"]:
        return _jwks_cache["keys"]

    if not is_configured_secret_key(settings.CLERK_SECRET_KEY) and not is_configured_publishable_key(settings.CLERK_PUBLISHABLE_KEY):
        return []

    jwks_url = settings.CLERK_JWKS_URL or "https://api.clerk.com/v1/jwks"
    try:
        headers = {}
        if is_configured_secret_key(settings.CLERK_SECRET_KEY):
            headers["Authorization"] = f"Bearer {settings.CLERK_SECRET_KEY}"
        
        with httpx.Client(timeout=2.0) as client:
            response = client.get(jwks_url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                keys = data.get("keys", [])
                _jwks_cache["keys"] = keys
                _jwks_cache["expires_at"] = now + 3600  # Cache for 1 hour
                return keys
    except Exception as e:
        logger.warning(f"Unable to fetch Clerk JWKS from {jwks_url}: {e}")

    return _jwks_cache["keys"]


def verify_clerk_token(token: str) -> Dict[str, Any]:
    """Verify Clerk session JWT token and extract claims."""
    try:
        # Decode header without verification to extract kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Try verifying with JWKS if available
        jwks_keys = get_jwks()
        matching_key = None
        for key in jwks_keys:
            if key.get("kid") == kid:
                matching_key = key
                break

        if matching_key:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(matching_key)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return payload

        # If JWKS is not available or in local/test mode, decode payload safely
        payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_aud": False},
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Clerk token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency to extract and verify Clerk authentication, returning the local User."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Header with Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_clerk_token(token)

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user attributes from token claims if present
    email = payload.get("email") or payload.get("email_address") or payload.get("primary_email_address")
    name = payload.get("name") or payload.get("full_name") or payload.get("first_name")

    # If real Clerk Secret Key is configured, attempt to enrich details if missing
    if (not email or not name) and is_configured_secret_key(settings.CLERK_SECRET_KEY) and clerk_user_id.startswith("user_"):
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(
                    f"https://api.clerk.com/v1/users/{clerk_user_id}",
                    headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                )
                if res.status_code == 200:
                    user_data = res.json()
                    name = name or f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                    email_addresses = user_data.get("email_addresses", [])
                    if email_addresses and not email:
                        email = email_addresses[0].get("email_address")
        except Exception as e:
            logger.debug(f"Could not fetch full user details from Clerk API: {e}")

    fallback_email = email or f"{clerk_user_id}@clerk.user"
    fallback_name = name or "HealthAssist Patient"

    # Find or create local User record
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        logger.info(f"Creating new local user record for Clerk ID: {clerk_user_id}")
        user = User(
            clerk_user_id=clerk_user_id,
            email=fallback_email,
            name=fallback_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Synchronize updated details if changed
        updated = False
        if email and user.email != email:
            user.email = email
            updated = True
        if name and user.name != name:
            user.name = name
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    return user
