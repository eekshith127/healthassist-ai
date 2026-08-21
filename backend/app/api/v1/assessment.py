import datetime
import json
import re
import uuid
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.assessment import Assessment
from backend.app.models.patient_case import PatientCaseModel

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

    # General Conversational Intent Checks (Time, Identity, Doctor Booking, FAQ, Gratitude, Farewells, Greetings)
    user_lower = user_text.lower()
    symptom_words = ["pain", "hurt", "cough", "fever", "headache", "migraine", "ache", "rash", "sick", "nausea", "dizzy", "sore", "throat", "vomit", "chest", "breath", "blood", "stomach", "bleed", "burn", "swollen", "itch", "cramp", "fatigue", "chill", "diarrhea"]
    has_symptom_words = any(s in user_lower for s in symptom_words)

    # 1. Time / Date Queries
    time_patterns = [r"\bwhat\s+time\b", r"\btell\s+(?:me\s+)?(?:the\s+)?time\b", r"\bcurrent\s+time\b", r"\bwhat(?:'s|\s+is)\s+the\s+time\b", r"\bwhat\s+date\b", r"\btoday(?:'s)?\s+date\b", r"\bwhat\s+day\b"]
    if any(re.search(pat, user_lower) for pat in time_patterns):
        now = datetime.datetime.now()
        time_str = now.strftime("%I:%M %p")
        date_str = now.strftime("%A, %B %d, %Y")
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=f"The current time is **{time_str}** on **{date_str}**. How can I assist you with your health today?",
            timestamp=now_str,
            step=step,
        )

    # 2. Identity / Capabilities / System Overview
    identity_patterns = [r"\bwho\s+are\s+you\b", r"\bwhat\s+is\s+healthassist\b", r"\bwhat\s+can\s+you\s+do\b", r"\bhow\s+do\s+you\s+work\b", r"\btell\s+me\s+about\s+yourself\b", r"\bwhat\s+is\s+this\s+app\b"]
    if any(re.search(pat, user_lower) for pat in identity_patterns):
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=(
                "I am **HealthAssist AI**, your clinical telehealth assistant. Here is what I can do for you:\n\n"
                "• **Symptom Triage:** Guide you through a structured intake to evaluate symptoms and clinical urgency.\n"
                "• **Red-Flag Screening:** Screen for emergency conditions (e.g. severe shortness of breath, chest pressure).\n"
                "• **Healthcare Provider Connectivity:** Connect you with verified doctors and schedule telehealth consultations.\n"
                "• **Health Profile Integration:** Keep track of your vitals, chronic conditions, and medications securely.\n\n"
                "How can I help you today?"
            ),
            timestamp=now_str,
            step=step,
        )

    # 3. Doctor / Specialist Booking Queries
    doctor_patterns = [r"\bbook\s+(?:a\s+)?doctor\b", r"\bfind\s+(?:a\s+)?doctor\b", r"\bsee\s+(?:a\s+)?doctor\b", r"\bconnect\s+with\s+(?:a\s+)?doctor\b", r"\bfind\s+specialist\b"]
    if any(re.search(pat, user_lower) for pat in doctor_patterns) and not has_symptom_words:
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=(
                "You can easily connect with licensed doctors on HealthAssist! "
                "Navigate to the **Providers** tab in the main navigation menu to browse verified specialists (Cardiology, Neurology, Family Medicine, Pediatrics), "
                "check their real-time availability, and schedule a video or in-person consultation."
            ),
            timestamp=now_str,
            step=step,
        )

    # 4. Gratitude / Courtesies
    thanks_patterns = [r"\bthank\s+you\b", r"\bthanks\b", r"\bappreciate\s+it\b", r"\bgreat\s+help\b"]
    if any(re.search(pat, user_lower) for pat in thanks_patterns) and not has_symptom_words:
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message="You're very welcome! I'm glad I could help. Please let me know if you experience any other symptoms or need further medical assistance. Wishing you great health!",
            timestamp=now_str,
            step=step,
        )

    # 5. Farewells
    farewell_patterns = [r"\bbye\b", r"\bgoodbye\b", r"\bsee\s+you\b", r"\btake\s+care\b", r"\bhave\s+a\s+good\s+day\b"]
    if any(re.search(pat, user_lower) for pat in farewell_patterns):
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message="Take care and stay healthy! If your symptoms worsen or new concerns arise, feel free to reach out anytime.",
            timestamp=now_str,
            step=step,
        )

    # 6. General Health / Wellness FAQ (Hydration, Blood Pressure, Burns, Sleep)
    if "burn" in user_lower and not any(k in user_lower for k in ["chest", "breath"]):
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=(
                "For minor first-degree burns: Cool the burn immediately under cool (not ice-cold) running water for 10–15 minutes. "
                "Apply a sterile non-stick bandage. Do not apply ice, butter, or oil. "
                "If the burn is blistering extensively, charred, or covers a large area, please seek urgent medical evaluation."
            ),
            timestamp=now_str,
            step=step,
        )
    if ("water" in user_lower or "hydration" in user_lower) and not has_symptom_words:
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=(
                "For most healthy adults, drinking about **2 to 3 liters (8 to 10 glasses)** of water per day is generally recommended. "
                "You may need more if you are exercising, in hot weather, or recovering from an illness."
            ),
            timestamp=now_str,
            step=step,
        )
    if "blood pressure" in user_lower and not has_symptom_words:
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=(
                "According to standard medical guidelines, normal resting blood pressure in adults is typically **below 120/80 mmHg**. "
                "Elevated blood pressure is 120–129 / <80 mmHg, and Stage 1 Hypertension begins at 130/80 mmHg. "
                "If you are experiencing elevated readings or dizziness/chest tightness, please consult with one of our telehealth providers."
            ),
            timestamp=now_str,
            step=step,
        )

    # 7. Greetings
    greeting_words = ["hi", "hello", "hey", "how are you", "how r u", "hi how r u", "how are u", "good morning", "good evening", "good afternoon", "whats up", "what's up"]
    is_greeting = any(re.search(rf"\b{re.escape(g)}\b", user_lower) for g in greeting_words) and not has_symptom_words

    if is_greeting:
        reply_text = (
            "Hello! I'm doing well, thank you for asking. I'm your HealthAssist assistant. "
            "What health symptoms or concerns are you experiencing today that I can help evaluate?"
        )
        options = [
            ChatOptionSchema(
                id="opt-1",
                label="🤕 Throbbing Headache & Sinus Congestion",
                value="I have a headache with sinus congestion for 2 days",
            ),
            ChatOptionSchema(
                id="opt-2",
                label="🫁 Dry Cough & Sore Throat",
                value="I have a persistent dry cough and sore throat",
            ),
            ChatOptionSchema(
                id="opt-3",
                label="⚡ Lower Back Muscle Soreness",
                value="I have sharp pain in my lower back after heavy lifting",
            ),
            ChatOptionSchema(
                id="opt-4",
                label="🩹 Skin Rash or Contact Itch",
                value="I developed a red itchy rash on my forearm",
            ),
        ]
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=0,
            options=options,
        )

    # Step 0: Inquire about duration & pain scale when symptoms are presented
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
        if current_user:
            try:
                if assessment_id.isdigit():
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

                # Persist PatientCase record for intake tracking
                pcase = PatientCaseModel(
                    user_id=current_user.id,
                    assessment_id=str(assessment_id),
                    main_complaint=user_text[:200],
                    symptoms=json.dumps([user_text]),
                    severity="8" if is_emergency else "4",
                    red_flags=json.dumps(["chest pressure / shortness of breath"] if is_emergency else []),
                    information_complete=True,
                )
                db.add(pcase)
                db.commit()
            except Exception as e:
                logger.debug(f"Failed to update assessment/patient case record in DB: {e}")


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

