import datetime
import json
import secrets
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.health_profile import HealthProfile
from backend.app.models.health_card_share import HealthCardShare
from backend.app.schemas.health_card_share import (
    HealthCardShareResponse,
    PublicHealthCardResponse,
    RevokeShareResponse,
)
from backend.app.services.health_profile_service import health_profile_service
from backend.app.utils.clerk_auth import get_current_user
from backend.app.utils.phone import normalize_indian_phone, format_dial_phone
from backend.app.utils.logger import logger

router = APIRouter(prefix="/health-card", tags=["Health Card Sharing"])


def _parse_list(val: Any) -> List[str]:
    if not val:
        return []
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [s.strip() for s in str(val).split(",") if s.strip()]


@router.get("/share", response_model=HealthCardShareResponse)
def get_share_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the currently active cryptographically secure QR share token
    for the authenticated user.
    """
    now = datetime.datetime.utcnow()
    share = (
        db.query(HealthCardShare)
        .filter(
            HealthCardShare.user_id == current_user.id,
            HealthCardShare.is_active == True,
            HealthCardShare.revoked_at == None,
        )
        .order_by(HealthCardShare.created_at.desc())
        .first()
    )

    if share:
        if share.expires_at and share.expires_at < now:
            share.is_active = False
            db.commit()
            return HealthCardShareResponse(token=None, is_active=False)
        return HealthCardShareResponse(
            token=share.token,
            is_active=True,
            created_at=share.created_at,
            expires_at=share.expires_at,
            revoked_at=share.revoked_at,
        )

    return HealthCardShareResponse(token=None, is_active=False)


@router.post("/share", response_model=HealthCardShareResponse)
def generate_share_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates or retrieves an active 32+ byte random token for digital health card sharing.
    Never exposes internal user IDs in the QR share token.
    """
    now = datetime.datetime.utcnow()
    existing_share = (
        db.query(HealthCardShare)
        .filter(
            HealthCardShare.user_id == current_user.id,
            HealthCardShare.is_active == True,
            HealthCardShare.revoked_at == None,
        )
        .order_by(HealthCardShare.created_at.desc())
        .first()
    )

    if existing_share:
        if not existing_share.expires_at or existing_share.expires_at > now:
            return HealthCardShareResponse(
                token=existing_share.token,
                is_active=True,
                created_at=existing_share.created_at,
                expires_at=existing_share.expires_at,
                revoked_at=existing_share.revoked_at,
            )

    # Invalidate previous stale shares
    db.query(HealthCardShare).filter(
        HealthCardShare.user_id == current_user.id,
        HealthCardShare.is_active == True,
    ).update({"is_active": False, "revoked_at": now})

    # Generate 32 bytes of cryptographically secure randomness
    secure_token = secrets.token_urlsafe(32)
    expires_at = now + datetime.timedelta(days=90)

    new_share = HealthCardShare(
        user_id=current_user.id,
        token=secure_token,
        is_active=True,
        created_at=now,
        expires_at=expires_at,
        revoked_at=None,
    )
    db.add(new_share)
    db.commit()
    db.refresh(new_share)

    logger.info(f"Generated new secure QR health card token for user #{current_user.id}")

    return HealthCardShareResponse(
        token=new_share.token,
        is_active=True,
        created_at=new_share.created_at,
        expires_at=new_share.expires_at,
        revoked_at=None,
    )


@router.post("/share/revoke", response_model=RevokeShareResponse)
def revoke_share_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Instantly revokes all active QR share tokens for the authenticated user,
    preventing any future public access via previously generated QR codes.
    """
    now = datetime.datetime.utcnow()
    active_shares = (
        db.query(HealthCardShare)
        .filter(
            HealthCardShare.user_id == current_user.id,
            HealthCardShare.is_active == True,
        )
        .all()
    )

    for share in active_shares:
        share.is_active = False
        share.revoked_at = now

    db.commit()
    logger.info(f"Revoked {len(active_shares)} QR share tokens for user #{current_user.id}")

    return RevokeShareResponse(
        message="This health card link has been revoked.",
        revoked=True,
    )


@router.get("/public/{token}", response_model=PublicHealthCardResponse)
def get_public_health_card(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Public, unauthenticated emergency access point for scanned QR codes.
    Strictly verifies the token is valid, active, unexpired, and unrevoked.
    Returns only the necessary, sanitized clinical baseline data.
    Does NOT leak user IDs, emails, chat history, or private assessments.
    """
    if not token or len(token) < 16:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This health card link has been revoked or is no longer active.",
        )

    now = datetime.datetime.utcnow()
    share = (
        db.query(HealthCardShare)
        .filter(HealthCardShare.token == token)
        .first()
    )

    if not share or not share.is_active or share.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This health card link has been revoked or is no longer active.",
        )

    if share.expires_at and share.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This health card link has expired.",
        )

    user = share.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found.",
        )

    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == user.id)
        .first()
    )

    patient_name = user.full_name or user.name or "Patient"
    # Derived clinical age
    age = None
    if profile:
        age = profile.age if profile.age is not None else health_profile_service.calculate_age(profile.date_of_birth)

    # Biometrics & BMI
    height = profile.height_cm if profile else None
    weight = profile.weight_kg if profile else None
    bmi = None
    bmi_category = None
    if height and weight:
        bmi, bmi_category = health_profile_service.calculate_bmi(height, weight)

    # Normalize emergency contact phone for Indian dialling
    emergency_phone_formatted = None
    emergency_phone_dial = None
    if profile and profile.emergency_phone:
        emergency_phone_formatted = normalize_indian_phone(profile.emergency_phone)
        emergency_phone_dial = format_dial_phone(profile.emergency_phone)

    return PublicHealthCardResponse(
        patient_name=patient_name,
        patient_identifier=f"HA-{token[:6].upper()}",
        age=age,
        sex=profile.sex or profile.gender if profile else None,
        height_cm=height,
        weight_kg=weight,
        bmi=bmi,
        bmi_category=bmi_category,
        blood_group=profile.blood_group or profile.blood_type if profile else None,
        allergies=_parse_list(profile.allergies) if profile else [],
        medical_conditions=_parse_list(profile.medical_conditions or profile.chronic_conditions) if profile else [],
        medications=_parse_list(profile.medications or profile.current_medications) if profile else [],
        emergency_contact=profile.emergency_contact if profile else None,
        emergency_phone=emergency_phone_formatted,
        emergency_phone_dial=emergency_phone_dial,
        national_emergency_dispatch="112",
        national_emergency_dispatch_dial="tel:112",
        poison_control_centre="1800-116-117",
        poison_control_centre_dial="tel:1800116117",
        poison_control_name="AIIMS National Poisons Information Centre",
        created_at=share.created_at,
        updated_at=profile.updated_at if (profile and profile.updated_at) else share.created_at,
        disclaimer=(
            "This digital health card contains user-provided health information and is "
            "intended for health-awareness and emergency reference purposes. It is not a medical diagnosis."
        ),
    )
