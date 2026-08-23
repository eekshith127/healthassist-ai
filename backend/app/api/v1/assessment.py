import datetime
import json
import re
import uuid
from typing import List, Optional, Union, Dict, Any

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
from backend.app.ai.schemas import FinalAssessmentOutput
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


# Dynamic in-memory state tracking for active chat assessments
active_chat_sessions: Dict[str, Dict[str, Any]] = {}


@router.post("/{assessment_id}/messages", response_model=AssessmentMessageResponse)
async def post_assessment_message(
    assessment_id: str,
    payload: AssessmentMessageRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Handles multi-turn conversational health assessment intake.
    
    Engages the live Gemini Conversational Intake AI and triggers the 3-Model
    Live Consensus Pipeline when clinical intake is complete.
    """
    from backend.app.ai.intake import intake_agent
    from backend.app.ai.orchestrator import orchestrator
    from backend.app.ai.schemas import PatientCase

    user_text = payload.message.strip()
    step = payload.step if payload.step is not None else 0
    now_str = datetime.datetime.now().strftime("%I:%M %p")
    msg_id = f"bot-msg-{uuid.uuid4().hex[:8]}"

    # Initialize or retrieve session state
    if assessment_id not in active_chat_sessions:
        active_chat_sessions[assessment_id] = {
            "history": [],
            "patient_case": PatientCase(main_complaint="", symptoms=[]),
            "step": step,
        }
    session = active_chat_sessions[assessment_id]

    user_lower = user_text.lower()
    symptom_words = [
        "pain", "hurt", "cough", "fever", "headache", "migraine", "ache", "rash",
        "sick", "nausea", "dizzy", "sore", "throat", "vomit", "chest", "breath",
        "blood", "stomach", "bleed", "burn", "swollen", "itch", "cramp", "fatigue",
        "chill", "diarrhea", "congestion", "sinus", "wheezing"
    ]
    has_symptom_words = any(s in user_lower for s in symptom_words)

    # 1. Time / Date Queries
    time_patterns = [r"\bwhat\s+time\b", r"\btell\s+(?:me\s+)?(?:the\s+)?time\b", r"\bcurrent\s+time\b", r"\bwhat(?:'s|\s+is)\s+the\s+time\b", r"\bwhat\s+date\b", r"\btoday(?:'s)?\s+date\b", r"\bwhat\s+day\b"]
    if any(re.search(pat, user_lower) for pat in time_patterns) and not has_symptom_words:
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

    # 2. Identity / System Overview
    identity_patterns = [r"\bwho\s+are\s+you\b", r"\bwhat\s+is\s+healthassist\b", r"\bwhat\s+can\s+you\s+do\b", r"\bhow\s+do\s+you\s+work\b", r"\btell\s+me\s+about\s+yourself\b", r"\bwhat\s+is\s+this\s+app\b"]
    if any(re.search(pat, user_lower) for pat in identity_patterns) and not has_symptom_words:
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=(
                "I am **HealthAssist AI**, your intelligent clinical telehealth assistant. Here is how I help:\n\n"
                "• **Live Clinical Intake:** Conduct conversational intake with Gemini AI.\n"
                "• **Multi-LLM Consensus:** Evaluate your symptoms across 3 independent AI models concurrently.\n"
                "• **AI Judge Synthesis:** Summarize clinical findings and recommend appropriate specialist care.\n"
                "• **Emergency Safety Screening:** Screen for critical red flags with immediate safety overrides.\n\n"
                "What symptoms or health concerns can I help you assess today?"
            ),
            timestamp=now_str,
            step=step,
        )

    # 3. Greetings
    greeting_words = ["hi", "hello", "hey", "how are you", "how r u", "hi how r u", "how are u", "good morning", "good evening", "good afternoon", "whats up", "what's up"]
    is_greeting = any(re.search(rf"\b{re.escape(g)}\b", user_lower) for g in greeting_words) and not has_symptom_words

    if is_greeting:
        reply_text = (
            "Hello! I'm doing well, thank you. I'm your HealthAssist assistant. "
            "What health symptoms or concerns are you experiencing today that I can help evaluate?"
        )
        options = [
            ChatOptionSchema(
                id="opt-1",
                label="🤕 Throbbing Headache & Sinus Congestion",
                value="I have a throbbing headache with sinus congestion for 2 days",
            ),
            ChatOptionSchema(
                id="opt-2",
                label="🫁 Dry Cough & Sore Throat",
                value="I have a persistent dry cough and low-grade fever for 3 days",
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

    # Process conversational turn with Gemini Intake AI to extract/update PatientCase
    intake_turn = await intake_agent.process_turn(
        user_message=user_text,
        conversation_history=session["history"],
        current_case=session["patient_case"],
    )

    # Update session state with extracted patient case
    if intake_turn.patient_case:
        session["patient_case"] = intake_turn.patient_case

    # Append to history
    session["history"].append({"role": "user", "content": user_text})
    session["history"].append({"role": "assistant", "content": intake_turn.assistant_message})

    # Step 0: Inquire about duration & pain scale when initial symptoms are presented
    if step == 0:
        reply_text = (
            f"{intake_turn.assistant_message}\n\n"
            "To help evaluate clinical urgency, how long have you had these symptoms, and how would you rate your discomfort from 1 (mild) to 10 (severe)?"
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
                value="I have had these symptoms for 3 days with moderate discomfort (around 5/10)",
            ),
            ChatOptionSchema(
                id="dur-3",
                label="⏱️ 4 to 7 days (Persistent, 6-7/10)",
                value="Persistent for 5 days, discomfort is noticeable (around 6/10)",
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

    # Step 1: Emergency red-flag safety screening
    elif step == 1:
        reply_text = (
            "Understood. Before our Multi-LLM consensus protocol generates your full clinical summary, "
            "are you experiencing any of the following emergency red flags?\n\n"
            "• High fever (> 102°F / 39°C)\n"
            "• Severe shortness of breath, sudden chest pressure, or heart palpitations\n"
            "• Sudden neurological symptoms, confusion, or neck stiffness\n"
            "• Inability to keep fluids down or loss of consciousness"
        )
        options = [
            ChatOptionSchema(
                id="red-no",
                label="✅ None of these red flags",
                value="None of these red flags apply to me. No breathing difficulty or chest pain.",
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

    # Step 2: Trigger the LIVE Multi-LLM Orchestration Pipeline!
    elif step == 2:
        # Check if user selected the emergency red flag option
        is_true_emergency = bool(
            ("severe chest pressure" in user_lower and "no" not in user_lower)
            or ("shortness of breath" in user_lower and "no" not in user_lower)
            or ("loss of consciousness" in user_lower)
        )

        current_case = session["patient_case"]
        if is_true_emergency:
            current_case.red_flags = list(set((current_case.red_flags or []) + ["severe chest pressure / dyspnea"]))

        # Execute the 3 live models (NVIDIA Llama 8B, Google Gemini, NVIDIA Model 3) + Consensus + AI Judge + Safety Engine
        db_session = db if isinstance(db, Session) else None
        uid = current_user.id if (current_user and hasattr(current_user, "id") and isinstance(current_user.id, int)) else None

        final_output = await orchestrator.execute_pipeline(
            patient_case=current_case,
            assessment_id=assessment_id,
            db=db_session,
            user_id=uid,
        )

        # Build differential diagnosis list from consensus and model outputs
        differential_diagnoses = []
        seen_names = set()
        if final_output.model_assessments:
            for m_id, m_data in final_output.model_assessments.items():
                for cond in m_data.possible_conditions:
                    norm_name = cond.name.strip().title()
                    if norm_name not in seen_names:
                        seen_names.add(norm_name)
                        factors_desc = ", ".join(cond.supporting_factors) if cond.supporting_factors else "Clinical presentation"
                        differential_diagnoses.append({
                            "name": cond.name,
                            "probability": cond.score,
                            "description": factors_desc,
                        })

        if not differential_diagnoses:
            differential_diagnoses.append({
                "name": final_output.leading_condition or "Upper Respiratory Tract Symptoms",
                "probability": final_output.consensus_score,
                "description": final_output.explanation[:160] if final_output.explanation else "Synthesized clinical evaluation.",
            })

        triage_lvl = (
            "emergency"
            if (final_output.safety_override or final_output.severity == "CRITICAL")
            else ("urgent" if final_output.severity in ["HIGH", "severe"] else "non-urgent")
        )

        summary_data = {
            "id": assessment_id,
            "symptoms": current_case.main_complaint or user_text,
            "duration": current_case.duration or "1 to 3 days",
            "severity": str(current_case.severity or 5),
            "triage_level": triage_lvl,
            "triageLevel": triage_lvl,
            "ai_summary": final_output.explanation,
            "aiSummary": final_output.explanation,
            "consensus_score": final_output.consensus_score,
            "consensusScore": final_output.consensus_score,
            "differentialDiagnoses": differential_diagnoses,
            "recommended_specialist": final_output.recommended_specialty,
            "recommendedSpecialist": final_output.recommended_specialty,
            "recommendedAction": final_output.recommended_next_step,
            "emergencyRedFlags": final_output.red_flags,
            "safety_checked": "override" if final_output.safety_override else "passed",
            "created_at": now_str,
        }

        # Response message combining AI Judge explanation and next steps
        if final_output.safety_override:
            reply_text = (
                "⚠️ **CRITICAL CLINICAL ALERT**\n\n"
                f"{final_output.explanation}\n\n"
                "**Action Required:** Please seek immediate emergency medical care."
            )
        else:
            reply_text = (
                f"**Clinical Consensus Summary ({final_output.model_agreement} Agreement - {final_output.consensus_score}% Score)**\n\n"
                f"• **Leading Assessment:** {final_output.leading_condition}\n"
                f"• **Clinical Synthesis:** {final_output.explanation}\n"
                f"• **Recommended Specialty:** {final_output.recommended_specialty}\n"
                f"• **Recommended Next Step:** {final_output.recommended_next_step}\n\n"
                f"_{final_output.disclaimer}_"
            )

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=3,
            assessment_summary=summary_data,
            final_assessment=final_output.model_dump(),
        )

    # Step 3+: Ongoing follow-up Q&A
    else:
        reply_text = (
            f"{intake_turn.assistant_message}\n\n"
            f"If you have further questions or if your symptoms change, our licensed telehealth providers are ready to assist."
        )
        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=step + 1,
            can_analyze=True,
        )


@router.post("/{assessment_id}/analyze", response_model=FinalAssessmentOutput)
async def analyze_assessment_pipeline(
    assessment_id: Union[int, str],
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Executes the complete HealthAssist Multi-LLM AI Assessment Pipeline:
    
    1. Evaluates normalized PatientCase
    2. Runs 3 Independent AI Assessments concurrently (NVIDIA, Ollama, Model 3)
    3. Calculates pure Python Deterministic Consensus
    4. Evaluates with AI Judge reasoning model
    5. Evaluates with Independent Deterministic Safety Engine (Strict Safety Override priority)
    6. Produces Final Assessment with healthcare provider recommendations
    7. Securely persists records to database
    """
    from backend.app.ai.orchestrator import orchestrator
    from backend.app.ai.schemas import PatientCase

    # Look up existing PatientCase record
    patient_case_obj = None
    if str(assessment_id).isdigit():
        pcase_record = (
            db.query(PatientCaseModel)
            .filter(PatientCaseModel.assessment_id == str(assessment_id))
            .order_by(PatientCaseModel.created_at.desc())
            .first()
        )
        if pcase_record:
            patient_case_obj = pcase_record.to_schema()

    if not patient_case_obj:
        # Check if Assessment record exists
        if str(assessment_id).isdigit():
            ass_rec = db.query(Assessment).filter(Assessment.id == int(assessment_id)).first()
            if ass_rec:
                patient_case_obj = PatientCase(
                    main_complaint=ass_rec.symptoms[:100] if ass_rec.symptoms else "General Health Inquiry",
                    symptoms=[ass_rec.symptoms] if ass_rec.symptoms else ["general symptoms"],
                    duration=ass_rec.duration,
                    severity=ass_rec.severity,
                )

    if not patient_case_obj:
        patient_case_obj = PatientCase(
            main_complaint="General Clinical Inquiry",
            symptoms=["unspecified symptoms"],
        )

    # Execute end-to-end multi-LLM pipeline
    final_output = await orchestrator.execute_pipeline(
        patient_case=patient_case_obj,
        assessment_id=assessment_id,
        db=db,
    )
    return final_output


