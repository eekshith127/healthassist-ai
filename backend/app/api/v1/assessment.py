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
from backend.app.models.chat_message import ChatMessage

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
    """Returns only the clinical assessments belonging strictly to the authenticated user."""
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


@router.get("/{assessment_id}/messages", response_model=List[Dict[str, Any]])
def get_assessment_messages(
    assessment_id: Union[int, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the chronological conversation messages for an assessment belonging to the user."""
    # 1. Query by user_id and assessment_id directly
    db_messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.assessment_id == str(assessment_id),
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # 2. Fallback check via patient_case if none found with direct assessment_id
    if not db_messages:
        pcase = (
            db.query(PatientCaseModel)
            .filter(
                PatientCaseModel.assessment_id == str(assessment_id),
                (PatientCaseModel.user_id == current_user.id) | (PatientCaseModel.patient_id == current_user.id),
            )
            .first()
        )
        if pcase:
            db_messages = (
                db.query(ChatMessage)
                .filter(
                    ChatMessage.user_id == current_user.id,
                    ChatMessage.patient_case_id == pcase.id,
                )
                .order_by(ChatMessage.created_at.asc())
                .all()
            )

    return [
        {
            "id": f"msg-{m.id}",
            "sender": "user" if m.role == "user" else "bot",
            "text": m.content,
            "timestamp": m.created_at.strftime("%I:%M %p"),
            "role": m.role,
        }
        for m in db_messages
    ]


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
    
    Engages symptom-tailored Conversational Intake AI and triggers the 3-Model
    Live Consensus Pipeline when clinical intake is complete.
    Saves conversation turns and assessment records directly into database.
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

    # Save user message to database if user is authenticated
    if current_user and db:
        try:
            user_msg_db = ChatMessage(
                user_id=current_user.id,
                assessment_id=str(assessment_id),
                role="user",
                content=user_text,
            )
            db.add(user_msg_db)
            db.commit()
        except Exception as e:
            logger.warning(f"Could not persist user message to DB: {e}")

    user_lower = user_text.lower()
    symptom_words = [
        "pain", "hurt", "cough", "fever", "headache", "migraine", "ache", "rash",
        "sick", "nausea", "dizzy", "sore", "throat", "vomit", "chest", "breath",
        "blood", "stomach", "bleed", "burn", "swollen", "itch", "cramp", "fatigue",
        "chill", "diarrhea", "congestion", "sinus", "wheezing", "stiff", "joint", "skin"
    ]
    has_symptom_words = any(s in user_lower for s in symptom_words)

    # 1. Time / Date Queries
    time_patterns = [r"\bwhat\s+time\b", r"\btell\s+(?:me\s+)?(?:the\s+)?time\b", r"\bcurrent\s+time\b", r"\bwhat(?:'s|\s+is)\s+the\s+time\b", r"\bwhat\s+date\b", r"\btoday(?:'s)?\s+date\b", r"\bwhat\s+day\b"]
    if any(re.search(pat, user_lower) for pat in time_patterns) and not has_symptom_words:
        now = datetime.datetime.now()
        time_str = now.strftime("%I:%M %p")
        date_str = now.strftime("%A, %B %d, %Y")
        reply = f"The current time is **{time_str}** on **{date_str}**. What symptoms or health concerns can I help you evaluate today?"
        
        if current_user and db:
            try:
                db.add(ChatMessage(user_id=current_user.id, assessment_id=str(assessment_id), role="assistant", content=reply))
                db.commit()
            except Exception:
                pass

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply,
            timestamp=now_str,
            step=step,
        )

    # 2. Identity / System Overview
    identity_patterns = [r"\bwho\s+are\s+you\b", r"\bwhat\s+is\s+trishul\b", r"\bwhat\s+is\s+healthassist\b", r"\bwhat\s+can\s+you\s+do\b", r"\bhow\s+do\s+you\s+work\b", r"\btell\s+me\s+about\s+yourself\b", r"\bwhat\s+is\s+this\s+app\b"]
    if any(re.search(pat, user_lower) for pat in identity_patterns) and not has_symptom_words:
        reply = (
            "I am **TRISHUL AI**, your clinical health awareness and triage assistant. Here is how I assist:\n\n"
            "• **Clinical Intake:** Dynamic conversational symptom analysis tailored to your specific condition.\n"
            "• **Tri-Model Consensus:** Evaluate your case across 3 independent AI models (Llama 3.1, Gemini Flash, Nemotron 30B) concurrently.\n"
            "• **AI Judge Synthesis:** Consolidate differential findings, severity, and healthcare recommendations.\n"
            "• **Safety Engine:** Evaluate emergency red flags with clinical guideline overrides.\n\n"
            "What symptoms or health concerns can I help you assess today?"
        )
        if current_user and db:
            try:
                db.add(ChatMessage(user_id=current_user.id, assessment_id=str(assessment_id), role="assistant", content=reply))
                db.commit()
            except Exception:
                pass

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply,
            timestamp=now_str,
            step=step,
        )

    # 3. Greetings
    greeting_words = ["hi", "hello", "hey", "how are you", "how r u", "hi how r u", "how are u", "good morning", "good evening", "good afternoon", "whats up", "what's up"]
    is_greeting = any(re.search(rf"\b{re.escape(g)}\b", user_lower) for g in greeting_words) and not has_symptom_words

    if is_greeting:
        reply_text = (
            "Hello! I'm your TRISHUL AI assistant. "
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
        if current_user and db:
            try:
                db.add(ChatMessage(user_id=current_user.id, assessment_id=str(assessment_id), role="assistant", content=reply_text))
                db.commit()
            except Exception:
                pass

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=0,
            options=options,
        )

    # Process conversational turn with Gemini/Intake AI to dynamically extract PatientCase and tailored follow-ups
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

    # Convert IntakeTurnOutput options to ChatOptionSchema
    dynamic_options: List[ChatOptionSchema] = []
    if hasattr(intake_turn, "options") and intake_turn.options:
        for opt in intake_turn.options:
            if isinstance(opt, dict):
                dynamic_options.append(ChatOptionSchema(
                    id=opt.get("id", f"opt-{uuid.uuid4().hex[:4]}"),
                    label=opt.get("label", ""),
                    value=opt.get("value", ""),
                ))
            elif hasattr(opt, "id"):
                dynamic_options.append(ChatOptionSchema(
                    id=opt.id,
                    label=opt.label,
                    value=opt.value,
                ))

    # Step 3+: Ongoing follow-up Q&A
    if step >= 3:
        reply_text = (
            f"{intake_turn.assistant_message}\n\n"
            f"If you have further symptoms or questions, feel free to ask or begin a new assessment anytime."
        )
        if current_user and db:
            try:
                db.add(ChatMessage(user_id=current_user.id, assessment_id=str(assessment_id), role="assistant", content=reply_text))
                db.commit()
            except Exception:
                pass

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=step + 1,
            can_analyze=True,
        )

    # Step 2: Trigger the LIVE Multi-LLM Consensus Pipeline when intake is complete or step == 2!
    elif step == 2 or intake_turn.information_complete:
        is_true_emergency = bool(
            ("severe chest pressure" in user_lower and "no" not in user_lower)
            or ("shortness of breath" in user_lower and "no" not in user_lower)
            or ("loss of consciousness" in user_lower)
        )

        current_case = session["patient_case"]
        if is_true_emergency:
            current_case.red_flags = list(set((current_case.red_flags or []) + ["severe chest pressure / dyspnea"]))

        # Execute the 3 live models + Consensus + AI Judge + Safety Engine
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
                "name": final_output.leading_condition or "Clinical Symptom Evaluation",
                "probability": final_output.consensus_score,
                "description": final_output.explanation[:160] if final_output.explanation else "Synthesized clinical evaluation.",
            })

        triage_lvl = (
            "emergency"
            if (final_output.safety_override or final_output.severity == "CRITICAL")
            else ("urgent" if final_output.severity in ["HIGH", "severe"] else "non-urgent")
        )

        # Convert model_assessments to serializable dictionary
        model_assessments_dict = {}
        if final_output.model_assessments:
            for m_key, m_val in final_output.model_assessments.items():
                model_assessments_dict[m_key] = m_val.model_dump() if hasattr(m_val, "model_dump") else m_val

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
            "modelAgreement": final_output.model_agreement,
            "model_agreement": final_output.model_agreement,
            "disagreements": final_output.disagreements,
            "differentialDiagnoses": differential_diagnoses,
            "model_assessments": model_assessments_dict,
            "modelAssessments": model_assessments_dict,
            "recommended_specialist": final_output.recommended_specialty,
            "recommendedSpecialist": final_output.recommended_specialty,
            "recommendedAction": final_output.recommended_next_step,
            "recommended_next_step": final_output.recommended_next_step,
            "emergencyRedFlags": final_output.red_flags,
            "safety_checked": "override" if final_output.safety_override else "passed",
            "created_at": now_str,
        }

        # Response message combining AI Judge explanation and health awareness next steps
        if final_output.safety_override:
            reply_text = (
                "⚠️ **CRITICAL CLINICAL ALERT**\n\n"
                f"{final_output.explanation}\n\n"
                "**Action Required:** Please seek immediate emergency medical attention."
            )
        else:
            reply_text = (
                f"**Clinical Consensus Summary ({final_output.model_agreement} Agreement - {final_output.consensus_score}% Score)**\n\n"
                f"• **Leading Assessment:** {final_output.leading_condition}\n"
                f"• **Clinical Synthesis:** {final_output.explanation}\n"
                f"• **Recommended Healthcare Specialty:** {final_output.recommended_specialty}\n"
                f"• **Recommended Next Step:** {final_output.recommended_next_step}\n\n"
                f"_{final_output.disclaimer}_"
            )

        if current_user and db:
            try:
                # Save assistant assessment response to DB
                db.add(ChatMessage(user_id=current_user.id, assessment_id=str(assessment_id), role="assistant", content=reply_text))
                
                # Also create or update the persistent Assessment record for this user
                existing_ass = None
                if str(assessment_id).isdigit():
                    existing_ass = db.query(Assessment).filter(Assessment.id == int(assessment_id)).first()
                
                if not existing_ass:
                    new_ass = Assessment(
                        user_id=current_user.id,
                        symptoms=current_case.main_complaint or user_text,
                        duration=current_case.duration or "1 to 3 days",
                        severity=str(current_case.severity or 5),
                        triage_level=triage_lvl,
                        ai_summary=final_output.explanation,
                        consensus_score=final_output.consensus_score,
                        safety_checked="override" if final_output.safety_override else "passed",
                        recommended_specialist=final_output.recommended_specialty,
                    )
                    db.add(new_ass)
                    db.commit()
                    db.refresh(new_ass)
                    summary_data["id"] = new_ass.id
                else:
                    existing_ass.ai_summary = final_output.explanation
                    existing_ass.consensus_score = final_output.consensus_score
                    existing_ass.triage_level = triage_lvl
                    existing_ass.recommended_specialist = final_output.recommended_specialty
                    existing_ass.safety_checked = "override" if final_output.safety_override else "passed"
                    db.commit()
            except Exception as e:
                logger.error(f"Error persisting assessment to database: {e}")

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=summary_data["id"],
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=3,
            assessment_summary=summary_data,
            final_assessment=final_output.model_dump(),
        )

    # Step 0 or 1: Dynamic symptom-specific intake follow-up
    else:
        reply_text = intake_turn.assistant_message
        next_step = step + 1

        if current_user and db:
            try:
                db.add(ChatMessage(user_id=current_user.id, assessment_id=str(assessment_id), role="assistant", content=reply_text))
                db.commit()
            except Exception:
                pass

        return AssessmentMessageResponse(
            id=msg_id,
            assessment_id=assessment_id,
            sender="bot",
            message=reply_text,
            timestamp=now_str,
            step=next_step,
            options=dynamic_options if dynamic_options else None,
        )


@router.post("/{assessment_id}/analyze", response_model=FinalAssessmentOutput)
async def analyze_assessment_pipeline(
    assessment_id: Union[int, str],
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Executes the complete HealthAssist Multi-LLM AI Assessment Pipeline."""
    from backend.app.ai.orchestrator import orchestrator
    from backend.app.ai.schemas import PatientCase

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

    uid = current_user.id if current_user else None

    final_output = await orchestrator.execute_pipeline(
        patient_case=patient_case_obj,
        assessment_id=assessment_id,
        db=db,
        user_id=uid,
    )
    return final_output
