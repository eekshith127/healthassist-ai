"""Gemini Conversational Intake AI for HealthAssist.

Engages in empathetic, structured clinical intake dialogues to gather missing
information (symptoms, duration, severity, onset, associated symptoms, red flags)
and produce a structured PatientCase without diagnosing or prescribing.
"""

import json
from typing import List, Dict, Any, Optional
from backend.app.ai.base import BaseLLMProvider
from backend.app.ai.gemini_provider import GeminiProvider
from backend.app.ai.schemas import PatientCase, IntakeTurnOutput, ChatOptionItem
from backend.app.utils.config import settings
from backend.app.utils.logger import logger


INTAKE_SYSTEM_INSTRUCTION = """You are the Conversational Intake AI for TRISHUL AI, an intelligent clinical telemedicine assistance platform.
Your mission is to conduct an empathetic, concise, and clinically structured pre-consultation intake with the patient.

RESPONSIBILITIES:
1. Identify the patient's primary complaint and specific symptoms.
2. Ask 1-2 focused, clinically relevant follow-up questions tailored SPECIFICALLY to the patient's reported symptoms:
   - For Rash / Skin: Ask about itching, burning, spreading, contact with new soaps/detergents, or blisters.
   - For Back / Joint Pain: Ask about movement triggers, radiating pain down legs/arms, numbness/tingling, or heavy lifting.
   - For Headache: Ask about light/sound sensitivity, nausea, throbbing vs steady ache, or visual aura.
   - For Cough / Throat: Ask about dry vs productive phlegm, fever, shortness of breath, or swallowing pain.
   - For Abdominal / Stomach: Ask about nausea, cramps, relationship to food/meals, or bowel changes.
   - For General Symptoms: Ask about onset, duration, severity (1-10), and aggravating factors.
3. Generate 3 to 4 dynamic, context-aware suggested quick-response chips ('options') relevant to your question.
4. Adapt your questions dynamically based on what the patient says. Do not ask rigid questionnaires.
5. When sufficient essential intake information has been gathered (symptom details, duration/onset, severity, red flag check), set information_complete to true.

STRICT CLINICAL BOUNDARIES:
- DO NOT provide a definitive diagnosis or medical conclusion.
- DO NOT prescribe medication or suggest drug dosages.
- DO NOT invent or hallucinate symptoms.
- ALWAYS ask only ONE or TWO focused questions at a time.

OUTPUT FORMAT:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "assistant_message": "Empathetic response with 1-2 focused symptom-tailored questions or a warm closing summary if complete.",
  "information_complete": false,
  "options": [
    {"id": "opt-1", "label": "⏱️ Less than 24 hrs (Mild 2/10)", "value": "Started less than 24 hours ago, mild discomfort"},
    {"id": "opt-2", "label": "⏱️ 2-3 days (Moderate 5/10)", "value": "Has lasted 2-3 days with moderate discomfort"}
  ],
  "patient_case": {
    "main_complaint": "string",
    "symptoms": ["string"],
    "duration": "string or null",
    "severity": 5,
    "onset": "string",
    "associated_symptoms": [],
    "medical_conditions": [],
    "medications": [],
    "allergies": [],
    "age": null,
    "sex": null,
    "red_flags": []
  }
}"""


class GeminiIntakeAI:
    """Conversational clinical intake agent with symptom-tailored follow-ups."""

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or (GeminiProvider() if not settings.MOCK_MODE else None)

    async def process_turn(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        current_case: Optional[PatientCase] = None,
    ) -> IntakeTurnOutput:
        """Processes a conversation turn and returns assistant message + updated PatientCase."""
        if settings.MOCK_MODE or self.provider is None:
            return self._mock_intake_turn(user_message, conversation_history, current_case)

        # Build prompt incorporating history and current case state
        prompt_parts: List[str] = []
        prompt_parts.append("### CURRENT EXTRACTED PATIENT CASE STATE:")
        if current_case:
            prompt_parts.append(json.dumps(current_case.model_dump(), indent=2))
        else:
            prompt_parts.append("None (New conversation turn)")

        prompt_parts.append("\n### CONVERSATION HISTORY:")
        if conversation_history:
            for turn in conversation_history[-6:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                prompt_parts.append(f"{role.upper()}: {content}")

        prompt_parts.append(f"\nPATIENT'S LATEST MESSAGE:\n{user_message}")
        full_prompt = "\n".join(prompt_parts)

        try:
            output: IntakeTurnOutput = await self.provider.generate_structured(
                prompt=full_prompt,
                schema=IntakeTurnOutput,
                system_instruction=INTAKE_SYSTEM_INSTRUCTION,
                temperature=0.2,
            )
            return output
        except Exception as e:
            logger.warning(f"Live Gemini intake call failed: {e}. Falling back to symptom-aware clinical parser.")
            return self._mock_intake_turn(user_message, conversation_history, current_case)

    def _mock_intake_turn(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        current_case: Optional[PatientCase] = None,
    ) -> IntakeTurnOutput:
        """Deterministic symptom-aware clinical intake simulation for fallback/offline mode."""
        msg_lower = user_message.lower()
        history = conversation_history or []
        turn_count = len(history) // 2

        case = current_case or PatientCase()
        symptoms = list(case.symptoms or [])
        associated = list(case.associated_symptoms or [])
        red_flags = list(case.red_flags or [])
        main_complaint = case.main_complaint or ""
        duration = case.duration
        severity = case.severity
        onset = case.onset

        # 1. Symptom & Complaint Extraction
        symptom_categories = {
            "dermatology": ["rash", "itch", "itchy", "red spot", "spots", "hives", "skin", "eczema", "blister", "bump"],
            "musculoskeletal": ["back pain", "lower back", "spine", "neck pain", "joint", "knee", "shoulder", "muscle", "stiff", "ache", "sprain"],
            "neurology": ["headache", "migraine", "head pressure", "throbbing head", "dizzy", "dizziness", "lightheaded", "vertigo"],
            "respiratory": ["cough", "coughing", "dry cough", "sore throat", "throat", "congestion", "sinus", "runny nose", "wheezing", "phlegm"],
            "gastrointestinal": ["stomach", "abdominal", "nausea", "vomit", "vomiting", "diarrhea", "cramp", "bloating", "acid reflux", "heartburn", "gerd"],
            "cardiac": ["chest pain", "chest pressure", "tightness", "heart racing", "palpitation", "shortness of breath"],
        }

        detected_category = "general"
        for cat, kws in symptom_categories.items():
            if any(k in msg_lower for k in kws):
                detected_category = cat
                for k in kws:
                    if k in msg_lower and k not in symptoms:
                        symptoms.append(k)
                if not main_complaint:
                    main_complaint = user_message[:60]
                break

        if not main_complaint:
            main_complaint = user_message[:60]

        # 2. Emergency Red Flags Check
        emergency_kws = ["severe chest pressure", "shortness of breath", "sudden numbness", "anaphylaxis", "worst headache", "loss of consciousness", "coughing blood"]
        for ekw in emergency_kws:
            if ekw in msg_lower and ekw not in red_flags:
                red_flags.append(ekw)

        # 3. Duration & Severity Extraction
        if any(w in msg_lower for w in ["day", "hour", "week", "month", "yesterday", "today"]):
            duration = user_message
        for num in range(1, 11):
            if f"{num}/10" in msg_lower or f" {num} " in f" {msg_lower} ":
                severity = num

        case.main_complaint = main_complaint
        case.symptoms = symptoms if symptoms else [user_message[:40]]
        case.duration = duration
        case.severity = severity
        case.onset = onset
        case.associated_symptoms = associated
        case.red_flags = red_flags

        options: List[ChatOptionItem] = []

        # Turn 0: Symptom-Specific Questions & Options
        if turn_count == 0:
            if detected_category == "dermatology":
                reply = (
                    "I understand you are experiencing skin irritation or a rash. "
                    "How long has this rash been present, is it itching or spreading, and have you recently used any new soaps, detergents, or medications?"
                )
                options = [
                    ChatOptionItem(id="opt-rash-1", label="⏱️ Started 1-2 days ago, very itchy", value="The rash started 1-2 days ago and is intensely itchy with mild redness."),
                    ChatOptionItem(id="opt-rash-2", label="🧼 New soap/detergent exposure", value="I recently started using a new laundry detergent and noticed small bumps."),
                    ChatOptionItem(id="opt-rash-3", label="🩹 Spreading across arms/torso", value="The rash started in one spot and is gradually spreading, discomfort is moderate 4/10."),
                    ChatOptionItem(id="opt-rash-4", label="⚠️ Burning sensation with warmth", value="The area feels warm and tender to touch, pain is around 5/10."),
                ]
            elif detected_category == "musculoskeletal":
                reply = (
                    "I see you are dealing with muscle or joint discomfort. "
                    "Did this start suddenly (e.g. after lifting or exercise) or build gradually, and does the pain radiate or cause any numbness?"
                )
                options = [
                    ChatOptionItem(id="opt-msk-1", label="🏋️ Sudden after heavy lifting / exercise", value="It started suddenly after heavy lifting, discomfort is around 6/10 when bending."),
                    ChatOptionItem(id="opt-msk-2", label="⏱️ Gradual stiffness for 3-5 days", value="It built up gradually over the last 4 days, mostly dull stiffness around 4/10."),
                    ChatOptionItem(id="opt-msk-3", label="⚡ Sharp pain when moving", value="Sharp localized pain when twisting or walking, rated 5-6/10."),
                    ChatOptionItem(id="opt-msk-4", label="🦵 Pain radiating down leg/arm", value="The pain radiates down with mild tingling sensation."),
                ]
            elif detected_category == "neurology":
                reply = (
                    "I understand you are experiencing head discomfort. "
                    "How long has this headache lasted, is it a throbbing sensation on one side or a steady pressure, and are you sensitive to bright light or sound?"
                )
                options = [
                    ChatOptionItem(id="opt-neuro-1", label="🤕 One-sided throbbing with light sensitivity", value="Throbbing pain on one side of my head with nausea and light sensitivity (7/10)."),
                    ChatOptionItem(id="opt-neuro-2", label="⏱️ Constant band-like pressure for 2 days", value="Steady tight pressure around both temples for 2 days (4-5/10)."),
                    ChatOptionItem(id="opt-neuro-3", label="👃 Frontal sinus pain & nasal pressure", value="Pressure focused behind my eyes and forehead with sinus congestion."),
                    ChatOptionItem(id="opt-neuro-4", label="⚡ Sudden intense headache", value="Sudden onset headache that peaked within minutes."),
                ]
            elif detected_category == "respiratory":
                reply = (
                    "I see you have respiratory symptoms. "
                    "How long have you had this cough or throat irritation, is it dry or producing phlegm, and do you have any fever or shortness of breath?"
                )
                options = [
                    ChatOptionItem(id="opt-resp-1", label="🫁 Dry scratchy cough for 3 days", value="Persistent dry tickly cough and scratchy throat for 3 days, mild discomfort 3/10."),
                    ChatOptionItem(id="opt-resp-2", label="🌡️ Productive cough with mild fever", value="Coughing up clear mucus with low-grade fever and fatigue for 2 days (5/10)."),
                    ChatOptionItem(id="opt-resp-3", label="🗣️ Severe sore throat when swallowing", value="Severe throat pain when swallowing and nasal congestion for 4 days."),
                    ChatOptionItem(id="opt-resp-4", label="⏱️ Lingering cough over 1 week", value="Cough has persisted for over 10 days after a cold."),
                ]
            elif detected_category == "gastrointestinal":
                reply = (
                    "I understand you are experiencing digestive discomfort. "
                    "When did this start, is the pain cramping or burning, and have you had any nausea, vomiting, or changes after eating?"
                )
                options = [
                    ChatOptionItem(id="opt-gi-1", label="🤢 Cramping & nausea for 24 hours", value="Intermittent stomach cramps with nausea since yesterday (5/10)."),
                    ChatOptionItem(id="opt-gi-2", label="🔥 Burning upper stomach after meals", value="Burning discomfort in upper stomach after eating spicy or acidic food."),
                    ChatOptionItem(id="opt-gi-3", label="⏱️ Dull ache & bloating for 3 days", value="Persistent abdominal bloating and dull ache for 3 days (4/10)."),
                    ChatOptionItem(id="opt-gi-4", label="💧 Loose stools & dehydration", value="Frequent diarrhea and mild stomach cramps since this morning."),
                ]
            else:
                reply = (
                    "Thank you for sharing your symptoms. To help evaluate your clinical picture, "
                    "when did these symptoms begin, and how would you rate your overall discomfort from 1 (mild) to 10 (severe)?"
                )
                options = [
                    ChatOptionItem(id="opt-gen-1", label="⏱️ Less than 24 hours (Mild 2-3/10)", value="Symptoms began less than 24 hours ago, discomfort is mild around 2/10."),
                    ChatOptionItem(id="opt-gen-2", label="⏱️ 2 to 4 days (Moderate 4-5/10)", value="I have had these symptoms for 3 days with moderate discomfort around 5/10."),
                    ChatOptionItem(id="opt-gen-3", label="⏱️ Persistent for 1 week (6-7/10)", value="Persistent for a week, noticeable discomfort around 6/10."),
                    ChatOptionItem(id="opt-gen-4", label="⏱️ Chronic / Over 2 weeks", value="These symptoms have been present on and off for several weeks."),
                ]
            complete = False

        # Turn 1: Symptom-Specific Red Flag / Additional Context Check
        elif turn_count == 1:
            if detected_category == "dermatology":
                reply = (
                    "Thank you for those details. Are you experiencing any emergency red flags or warning signs, "
                    "such as swelling of the lips/throat, difficulty breathing, or rapid blistering?"
                )
                options = [
                    ChatOptionItem(id="opt-r-no", label="✅ No red flags or breathing difficulty", value="None of these red flags apply. No facial swelling or breathing issues."),
                    ChatOptionItem(id="opt-r-mild", label="🌡️ Mild localized warmth only", value="Just mild localized itching and warmth on the skin."),
                    ChatOptionItem(id="opt-r-yes", label="⚠️ Yes, severe swelling / breathing issues", value="I have swelling around my face or shortness of breath."),
                ]
            elif detected_category == "musculoskeletal":
                reply = (
                    "Understood. Are you experiencing any emergency red flags or warning signs, "
                    "such as loss of bowel/bladder control, severe numbness, or inability to bear weight?"
                )
                options = [
                    ChatOptionItem(id="opt-m-no", label="✅ No red flags or weakness", value="None of these red flags apply. No weakness, numbness, or bladder issues."),
                    ChatOptionItem(id="opt-m-stiff", label="🧘 Pain worsens with bending", value="Pain worsens with bending and sitting, relieved slightly by lying down."),
                    ChatOptionItem(id="opt-m-yes", label="⚠️ Severe numbness or leg weakness", value="I have noticeable weakness or numbness in my lower limbs."),
                ]
            elif detected_category == "neurology":
                reply = (
                    "Got it. Are you experiencing any emergency red flags or warning signs, "
                    "such as sudden speech difficulty, facial drooping, confusion, high fever, or stiff neck?"
                )
                options = [
                    ChatOptionItem(id="opt-n-no", label="✅ None of these red flags", value="None of these red flags apply. No speech changes or stiff neck."),
                    ChatOptionItem(id="opt-n-aur", label="👁️ Visual sensitivity only", value="Only sensitivity to bright light and mild fatigue."),
                    ChatOptionItem(id="opt-n-yes", label="⚠️ Sudden weakness or confusion", value="I am experiencing sudden weakness or unusual confusion."),
                ]
            else:
                reply = (
                    "Got it. Are you experiencing any associated emergency red flags or warning signs, "
                    "such as severe shortness of breath, sudden chest tightness, high fever (>102°F), or dizziness?"
                )
                options = [
                    ChatOptionItem(id="opt-g-no", label="✅ None of these red flags", value="None of these red flags apply to me. No chest pain or breathing issues."),
                    ChatOptionItem(id="opt-g-mild", label="🌡️ Mild low-grade fever only", value="Only a slight low-grade fever, but breathing is normal."),
                    ChatOptionItem(id="opt-g-yes", label="⚠️ Yes, severe shortness of breath", value="I have severe shortness of breath or chest pressure."),
                ]
            complete = False

        # Turn 2+: Intake complete, ready for multi-model consensus
        else:
            reply = (
                f"Thank you. I have collected your complete clinical intake for **{case.main_complaint}** (duration: {case.duration or 'recent'}, "
                f"severity: {case.severity or 'moderate'}). Initializing Multi-LLM clinical consensus assessment."
            )
            complete = True

        return IntakeTurnOutput(
            assistant_message=reply,
            information_complete=complete,
            patient_case=case,
            options=options,
        )


# Global singleton intake AI
intake_ai = GeminiIntakeAI()
intake_agent = intake_ai

