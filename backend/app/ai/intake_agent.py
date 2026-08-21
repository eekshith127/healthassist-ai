"""Conversational Intake AI Agent for HealthAssist.

Performs structured clinical intake conversations with patients, gathers missing
clinical information (symptoms, duration, severity, onset, associated symptoms),
incorporates persistent health profile context, detects red-flag symptoms, and
persists final PatientCase records without calling medical analysis models.
"""

import json
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session

from backend.app.schemas.intake import (
    PatientCase,
    IntakeOutput,
    IntakeConversationTurn,
)
from backend.app.schemas.health_profile import PatientCaseContext
from backend.app.models.patient_case import PatientCaseModel
from backend.app.ai.llm_provider import BaseLLMProvider, get_llm_provider
from backend.app.utils.logger import logger

INTAKE_SYSTEM_INSTRUCTION = """You are the Conversational Intake AI for HealthAssist, an intelligent telemedicine assistant.
Your goal is to conduct an empathetic, concise, and clinically structured pre-consultation intake with the patient.

RESPONSIBILITIES:
1. Understand the patient's primary complaint and all reported symptoms.
2. Ask relevant, concise follow-up questions to collect missing essential clinical information:
   - Clarification of the main complaint and specific symptoms
   - Duration (how long symptoms have lasted)
   - Severity (discomfort/pain rating on a 1-10 numerical scale or descriptive scale)
   - Onset (sudden vs. gradual, triggers, or aggravating/relieving factors)
   - Associated symptoms
   - Red-flag screening (e.g. severe shortness of breath, chest pressure, sudden neurological deficit, severe dizziness/fainting, high fever)
3. Use persistent health profile context (age, sex, chronic conditions, current medications, allergies) when relevant to contextualize questions without repeatedly asking for already known history.
4. Determine when enough information has been collected to formulate a complete clinical intake picture (set information_complete to true).
5. Identify any possible emergency red-flag symptoms and list them in the patient_case.red_flags array for the safety layer.

STRICT CLINICAL SAFETY CONSTRAINTS (MUST NEVER VIOLATE):
- DO NOT provide a definitive diagnosis or medical conclusion.
- DO NOT prescribe medication, suggest specific drug dosages, or recommend prescription treatments.
- DO NOT invent, assume, or hallucinate symptoms that the patient has not mentioned.
- DO NOT claim certainty.
- ALWAYS ask only ONE or TWO focused questions at a time to avoid overwhelming the patient.

OUTPUT FORMAT:
You MUST respond with a valid JSON object strictly matching this schema:
{
  "assistant_message": "Empathetic conversational response with 1-2 focused follow-up questions, or a warm closing intake summary if complete.",
  "information_complete": false,
  "patient_case": {
    "main_complaint": "Primary complaint description",
    "symptoms": ["symptom1", "symptom2"],
    "duration": "Duration description or null",
    "severity": 5,
    "onset": "Onset characteristics or empty string",
    "associated_symptoms": ["associated symptom 1"],
    "red_flags": []
  }
}
"""


class IntakeAgent:
    """Conversational Clinical Intake AI Agent."""

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()
        self.system_prompt = INTAKE_SYSTEM_INSTRUCTION

    def _build_context_prompt(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        health_profile: Optional[Union[PatientCaseContext, Dict[str, Any]]] = None,
        current_case: Optional[PatientCase] = None,
    ) -> str:
        """Constructs the structured prompt containing health context and conversation."""
        prompt_parts: List[str] = []

        # 1. Persistent Health Context
        prompt_parts.append("### PERSISTENT PATIENT HEALTH PROFILE CONTEXT:")
        if health_profile:
            if isinstance(health_profile, PatientCaseContext):
                hp_dict = health_profile.model_dump(exclude_none=True)
            elif isinstance(health_profile, dict):
                hp_dict = health_profile
            else:
                hp_dict = getattr(health_profile, "__dict__", {})

            age = hp_dict.get("age", "Unknown")
            sex = hp_dict.get("sex", "Unknown")
            conditions = hp_dict.get("relevant_conditions") or hp_dict.get("chronic_conditions") or []
            allergies = hp_dict.get("critical_allergies") or hp_dict.get("allergies") or []
            medications = hp_dict.get("active_medications") or hp_dict.get("current_medications") or []

            prompt_parts.append(f"- Age: {age}, Sex: {sex}")
            prompt_parts.append(f"- Known Conditions: {conditions if conditions else 'None reported'}")
            prompt_parts.append(f"- Known Allergies: {allergies if allergies else 'None reported'}")
            prompt_parts.append(f"- Active Medications: {medications if medications else 'None reported'}")
        else:
            prompt_parts.append("- No prior health profile records available (First-time intake).")

        # 2. Previously Extracted Case Information
        if current_case:
            prompt_parts.append("\n### CURRENT KNOWN PATIENT CASE STATE:")
            prompt_parts.append(json.dumps(current_case.model_dump(), indent=2))

        # 3. Conversation Dialogue History
        prompt_parts.append("\n### CONVERSATION HISTORY:")
        if conversation_history:
            for turn in conversation_history:
                role = turn.get("role", "user").capitalize()
                content = turn.get("content", "").strip()
                prompt_parts.append(f"{role}: {content}")
        else:
            prompt_parts.append("(No prior turns in this session)")

        # 4. Latest User Input
        prompt_parts.append("\n### LATEST USER MESSAGE:")
        prompt_parts.append(f"User: {user_message.strip()}")

        prompt_parts.append(
            "\n### INSTRUCTION:\n"
            "Analyze the latest user message in light of the conversation history and health profile. "
            "Update the patient_case fields with newly provided details. "
            "If key details (duration, severity 1-10, onset, or associated symptoms) are still missing, "
            "ask ONE or TWO focused follow-up questions and set information_complete to false. "
            "If all essential information is collected, or if an emergency red flag is present, set information_complete to true. "
            "Return the response in the specified JSON format."
        )

        return "\n".join(prompt_parts)

    async def process_turn(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        health_profile: Optional[Union[PatientCaseContext, Dict[str, Any]]] = None,
        current_case: Optional[PatientCase] = None,
        db: Optional[Session] = None,
        user_id: Optional[int] = None,
        assessment_id: Optional[Union[str, int]] = None,
    ) -> IntakeOutput:
        """Processes a single conversational turn through the Intake AI."""
        prompt = self._build_context_prompt(
            user_message=user_message,
            conversation_history=conversation_history,
            health_profile=health_profile,
            current_case=current_case,
        )

        try:
            raw_response = await self.provider.generate_json(
                prompt=prompt,
                system_instruction=self.system_prompt,
                schema=IntakeOutput,
            )
            intake_output = IntakeOutput.model_validate(raw_response)
        except Exception as e:
            logger.warning(f"Error parsing LLM response in IntakeAgent, applying fallback: {e}")
            # Fallback safe structured output
            intake_output = IntakeOutput(
                assistant_message=(
                    "Thank you for sharing your concern. To help our clinical team better understand your situation, "
                    "could you please share how long you have had these symptoms and rate your discomfort from 1 to 10?"
                ),
                information_complete=False,
                patient_case=PatientCase(
                    main_complaint=user_message[:100],
                    symptoms=[user_message[:50]],
                ),
            )

        # Merge with previously known case attributes if model omitted them
        if current_case:
            self._merge_case_state(intake_output.patient_case, current_case)

        # When information_complete is true: Save the final PatientCase to DB
        # Explicitly do NOT call the medical analysis models yet.
        if intake_output.information_complete and db is not None:
            try:
                saved_case = self.save_patient_case(
                    patient_case=intake_output.patient_case,
                    db=db,
                    user_id=user_id,
                    assessment_id=assessment_id,
                )
                logger.info(
                    f"Saved finalized PatientCase #{saved_case.id} for user #{user_id} (assessment {assessment_id})"
                )
            except Exception as save_err:
                logger.error(f"Failed to persist finalized PatientCase: {save_err}")

        return intake_output

    def _merge_case_state(self, current: PatientCase, previous: PatientCase) -> None:
        """Merges previously extracted patient case values into current case."""
        if not current.main_complaint and previous.main_complaint:
            current.main_complaint = previous.main_complaint
        if not current.duration and previous.duration:
            current.duration = previous.duration
        if current.severity is None and previous.severity is not None:
            current.severity = previous.severity
        if not current.onset and previous.onset:
            current.onset = previous.onset

        # Merge list attributes without duplicates
        for s in previous.symptoms:
            if s not in current.symptoms:
                current.symptoms.append(s)
        for a in previous.associated_symptoms:
            if a not in current.associated_symptoms:
                current.associated_symptoms.append(a)
        for r in previous.red_flags:
            if r not in current.red_flags:
                current.red_flags.append(r)

    def save_patient_case(
        self,
        patient_case: PatientCase,
        db: Session,
        user_id: Optional[int] = None,
        assessment_id: Optional[Union[str, int]] = None,
    ) -> PatientCaseModel:
        """Persists the finalized PatientCase into the database."""
        db_model = PatientCaseModel.from_schema(
            schema=patient_case,
            user_id=user_id,
            assessment_id=str(assessment_id) if assessment_id is not None else None,
            information_complete=True,
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model


# Singleton instance for easy application access
intake_agent = IntakeAgent()
