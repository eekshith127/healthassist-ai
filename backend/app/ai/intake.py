"""Gemini Conversational Intake AI for HealthAssist.

Engages in empathetic, structured clinical intake dialogues to gather missing
information (symptoms, duration, severity, onset, associated symptoms, red flags)
and produce a structured PatientCase without diagnosing or prescribing.
"""

import json
from typing import List, Dict, Any, Optional
from backend.app.ai.base import BaseLLMProvider
from backend.app.ai.gemini_provider import GeminiProvider
from backend.app.ai.schemas import PatientCase, IntakeTurnOutput
from backend.app.utils.config import settings
from backend.app.utils.logger import logger


INTAKE_SYSTEM_INSTRUCTION = """You are the Conversational Intake AI for HealthAssist, an intelligent telemedicine assistance system.
Your mission is to conduct an empathetic, concise, and clinically structured pre-consultation intake with the patient.

RESPONSIBILITIES:
1. Identify the patient's primary complaint and specific symptoms.
2. Ask 1-2 focused, relevant follow-up questions to collect missing essential clinical information:
   - Onset (sudden vs gradual, triggers)
   - Duration (how long symptoms have lasted)
   - Severity (pain/discomfort on a 1-10 numerical scale or descriptive scale)
   - Associated symptoms (secondary symptoms)
   - Pertinent medical history (known conditions, allergies, current medications)
   - Red-flag screening (severe shortness of breath, chest pressure, sudden numbness, high fever)
3. Adapt your questions dynamically based on what the patient says. Do not ask rigid questionnaires.
4. When sufficient essential intake information has been gathered, set information_complete to true.

STRICT CLINICAL BOUNDARIES:
- DO NOT provide a definitive diagnosis or medical conclusion.
- DO NOT prescribe medication or suggest drug dosages.
- DO NOT invent or hallucinate symptoms.
- ALWAYS ask only ONE or TWO focused questions at a time.

OUTPUT FORMAT:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "assistant_message": "Empathetic response with 1-2 focused questions or a warm closing summary if complete.",
  "information_complete": false,
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
    """Conversational clinical intake agent."""

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
            logger.warning(f"Live Gemini intake call failed: {e}. Falling back to offline clinical parser.")
            return self._mock_intake_turn(user_message, conversation_history, current_case)

    def _mock_intake_turn(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        current_case: Optional[PatientCase] = None,
    ) -> IntakeTurnOutput:
        """Deterministic, rule-based clinical intake simulation for mock mode and offline fallback."""
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
        symptom_candidates = [
            ("headache", ["headache", "migraine", "head pressure", "throbbing head"]),
            ("cough", ["cough", "coughing", "dry cough"]),
            ("sore throat", ["sore throat", "throat pain", "scratchy throat"]),
            ("fever", ["fever", "chills", "high temp"]),
            ("chest pain", ["chest pain", "chest pressure", "tightness"]),
            ("shortness of breath", ["shortness of breath", "hard to breathe", "dyspnea"]),
            ("back pain", ["back pain", "lower back pain", "spine pain"]),
            ("nausea", ["nausea", "vomiting", "upset stomach"]),
            ("rash", ["rash", "red spots", "itchy skin"]),
        ]

        for s_name, kws in symptom_candidates:
            if any(k in msg_lower for k in kws):
                if s_name not in symptoms:
                    symptoms.append(s_name)
                if not main_complaint:
                    main_complaint = s_name.capitalize()

        # 2. Red Flags
        emergency_kws = ["chest pain", "chest pressure", "shortness of breath", "sudden numbness", "anaphylaxis", "worst headache"]
        for ekw in emergency_kws:
            if ekw in msg_lower and ekw not in red_flags:
                red_flags.append(ekw)

        # 3. Duration & Severity Extraction
        if "day" in msg_lower or "hour" in msg_lower or "week" in msg_lower:
            duration = user_message
        for num in range(1, 11):
            if f"{num}/10" in msg_lower or f" {num} " in f" {msg_lower} ":
                severity = num

        case.main_complaint = main_complaint or "General Malaise"
        case.symptoms = symptoms if symptoms else ["unspecified symptoms"]
        case.duration = duration
        case.severity = severity
        case.onset = onset
        case.associated_symptoms = associated
        case.red_flags = red_flags

        # Progression logic
        if not duration and turn_count == 0:
            reply = (
                "Thank you for sharing your symptoms. To help evaluate your clinical picture, "
                "when did these symptoms start, and how would you rate your discomfort on a scale from 1 (mild) to 10 (severe)?"
            )
            complete = False
        elif not red_flags and turn_count == 1:
            reply = (
                "Got it. Are you experiencing any associated symptoms such as fever, shortness of breath, "
                "nausea, or dizziness?"
            )
            complete = False
        else:
            reply = (
                f"Thank you. I have collected your clinical intake for **{case.main_complaint}** (duration: {case.duration or 'recent'}, "
                f"severity: {case.severity or 'moderate'}). Your case is ready for Multi-LLM clinical assessment."
            )
            complete = True

        return IntakeTurnOutput(
            assistant_message=reply,
            information_complete=complete,
            patient_case=case,
        )


# Global singleton intake AI
intake_ai = GeminiIntakeAI()
intake_agent = intake_ai
