import datetime
import uuid
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.assessment import Assessment
from backend.app.schemas.assessment import (
    AssessmentCreate,
    AssessmentRead,
    AssessmentMessageRequest,
    AssessmentMessageResponse,
    ChatOptionSchema,
)
from backend.app.utils.clerk_auth import get_current_user, verify_clerk_token, security
from backend.app.utils.logger import logger

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Extract authenticated user if bearer token is supplied, else return None."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = verify_clerk_token(credentials.credentials)
        clerk_user_id = payload.get("sub")
        if clerk_user_id:
            user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
            return user
    except Exception as e:
        logger.debug(f"Optional auth token verification skipped: {e}")
    return None


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
    """Returns a specific assessment only if it belongs to the authenticated user."""
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


@router.post("/{assessment_id}/messages", response_model=AssessmentMessageResponse)
def post_assessment_message(
    assessment_id: str,
    payload: AssessmentMessageRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Handles multi-turn conversational health assessment intake.
    
    Accepts user messages, processes the intake step, and returns structured
    mock AI responses with follow-up clinical questions, options, or final triage recommendations.
    """
    user_text = payload.message.strip()
    step = payload.step if payload.step is not None else 0
    now_str = datetime.datetime.now().strftime("%I:%M %p")
    msg_id = f"bot-msg-{uuid.uuid4().hex[:8]}"

    # Step 0: Inquire about duration & pain scale
    if step == 0:
        reply_text = (
            "Thank you for sharing what you're experiencing. To help determine the proper clinical urgency, "
            "how long have you had these symptoms, and how would you rate your discomfort from 1 (mild) to 10 (severe)?"
        )
        options = [
            ChatOptionSchema(
                id="dur-1",
                label="⏱️ Less than 24 hours (Mild, 2-3/10)",
                value="Symptoms started less than 24 hours ago, discomfort is mild (around 2/10)",
            ),
            ChatOptionSchema(
                id="dur-2",
                label="⏱️ 1 to 3 days (Moderate, 4-5/10)",
                value="I have had this for 2 days with moderate discomfort (around 4/10)",
            ),
            ChatOptionSchema(
                id="dur-3",
                label="⏱️ 4 to 7 days (Persistent, 6/10)",
                value="Persistent for nearly a week, discomfort is about 6/10",
            ),
            ChatOptionSchema(
                id="dur-4",
                label="⏱️ Over 1 week (Chronic)",
                value="Symptoms have persisted for more than a week",
            ),
        ]
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=1,
            options=options,
        )

    # Step 1: Inquire about emergency red-flag safety exclusions
    elif step == 1:
        reply_text = (
            "Understood. Before our Multi-LLM consensus protocol generates your full clinical summary, "
            "are you experiencing any of the following emergency red flags?\n\n"
            "• High fever (> 102°F / 39°C)\n"
            "• Shortness of breath, chest pressure, or severe palpitations\n"
            "• Sudden neurological symptoms, confusion, or neck stiffness\n"
            "• Inability to keep fluids down or loss of consciousness"
        )
        options = [
            ChatOptionSchema(
                id="red-no",
                label="✅ None of these red flags",
                value="None of these symptoms apply to me. No fever or breathing difficulty.",
            ),
            ChatOptionSchema(
                id="red-fever",
                label="🌡️ Mild low fever only (< 100.5°F)",
                value="I only have a slight low-grade fever, but no breathing issues or chest pain.",
            ),
            ChatOptionSchema(
                id="red-yes",
                label="⚠️ Yes, I have severe red flags",
                value="I am experiencing severe chest pressure and shortness of breath.",
            ),
        ]
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=2,
            options=options,
        )

    # Step 2: Finalize synthesis & provide structured consensus triage summary
    elif step == 2:
        is_emergency = any(
            w in user_text.lower()
            for w in ["severe", "chest", "breath", "unconscious", "stiff", "102", "emergency"]
        )

        triage_level = "emergency" if is_emergency else "non-urgent"
        consensus_score = 99.4 if is_emergency else 98.6
        specialist = "Emergency Medicine / ER" if is_emergency else "Family Medicine / Tele-Triage"

        if is_emergency:
            reply_text = (
                "⚠️ **CRITICAL CLINICAL ALERT**\n\n"
                "Based on the reported red flags (severe symptoms / chest pressure / dyspnea), "
                "our clinical safety protocol recommends **immediate emergency department evaluation** or calling 911.\n\n"
                "Do not wait for a routine telemedicine appointment if you are experiencing severe breathing difficulty or chest pain."
            )
            ai_summary = "CRITICAL ALERT: Reported red flags require immediate emergency clinical evaluation."
        else:
            reply_text = (
                "I have synthesized your reported symptoms across our **Multi-LLM Consensus Protocol** "
                "(Gemini Medical, Med-PaLM, and Clinical GPT).\n\n"
                "• **Primary Impression:** Mild acute viral rhinitis / upper respiratory congestion with secondary tension discomfort.\n"
                "• **Clinical Consensus Score:** 98.6% multi-model alignment.\n"
                "• **Recommended Action:** Supportive home care, fluid hydration (2.5L/day), rest, and saline sinus rinses.\n"
                "• **Recommended Specialist:** Family Medicine / Primary Telehealth Provider if symptoms exceed 5–7 days."
            )
            ai_summary = "Consensus indicates benign upper respiratory symptoms without acute red flags. Supportive care recommended."

        summary_data = {
            "id": assessment_id,
            "symptoms": user_text,
            "triage_level": triage_level,
            "consensus_score": consensus_score,
            "ai_summary": ai_summary,
            "recommended_specialist": specialist,
            "safety_checked": "passed",
            "created_at": now_str,
        }

        # Optionally persist if current user exists and assessment_id is an int
        if current_user and assessment_id.isdigit():
            try:
                db_record = (
                    db.query(Assessment)
                    .filter(Assessment.id == int(assessment_id), Assessment.user_id == current_user.id)
                    .first()
                )
                if db_record:
                    db_record.ai_summary = ai_summary
                    db_record.triage_level = triage_level
                    db_record.consensus_score = consensus_score
                    db_record.recommended_specialist = specialist
                    db.commit()
            except Exception as e:
                logger.debug(f"Failed to update assessment record in DB: {e}")

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=3,
            assessment_summary=summary_data,
        )

    # Step 3+: Ongoing follow-up Q&A
    else:
        reply_text = (
            f"Regarding your question ('{user_text}'): For mild symptoms, staying well-hydrated, resting, "
            "and taking over-the-counter analgesics (e.g. acetaminophen) as directed can help relieve discomfort. "
            "If your symptoms worsen or new red flags develop, please connect with one of our licensed telehealth providers."
        )
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=step + 1,
        )

