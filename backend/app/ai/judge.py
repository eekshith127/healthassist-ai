"""AI Judge Reasoning Module for HealthAssist Multi-LLM Orchestration.

Synthesizes the 3 independent model assessments, explains agreements and
disagreements, identifies missing clinical details, and provides a clear,
objective clinical summary without exposing internal chain-of-thought.
"""

import json
from typing import Dict, Optional, Any
from backend.app.ai.base import BaseLLMProvider
from backend.app.ai.nvidia_provider import NVIDIAProvider
from backend.app.ai.schemas import (
    PatientCase,
    ModelAssessmentOutput,
    ConsensusOutput,
    JudgeOutput,
)
from backend.app.utils.config import settings
from backend.app.utils.logger import logger


JUDGE_SYSTEM_INSTRUCTION = """You are the AI Judge for HealthAssist, an intelligent multi-model telemedicine system.
You are reviewing three independent AI clinical assessments and their calculated deterministic consensus.

RESPONSIBILITIES:
1. Synthesize the findings into an objective, balanced clinical explanation.
2. Explain the consensus (why the majority models agreed on the leading condition).
3. If models disagreed, explain why the dissenting model proposed an alternative and what clinical nuances differentiate them.
4. Highlight missing clinical information or diagnostic tests needed to resolve uncertainty.
5. Recommend the most appropriate medical specialty and next steps for the patient.

STRICT CONSTRAINTS:
- DO NOT blindly follow majority voting if clinical evidence suggests caution.
- DO NOT expose internal chain-of-thought or reasoning tokens.
- Return ONLY a single valid JSON object strictly matching this schema:
{
  "synthesized_summary": "Concise summary of the clinical evaluation.",
  "agreement_explanation": "Explanation of clinical consensus.",
  "disagreement_explanation": "Explanation of differing model perspectives if any, or null.",
  "missing_information": ["Test A", "Exam B"],
  "recommended_specialty": "General Physician",
  "recommended_next_step": "Actionable next step recommendation."
}"""


class AIJudge:
    """AI Judge reasoning and clinical synthesis engine."""

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        if not settings.MOCK_MODE:
            self.provider = provider or NVIDIAProvider(
                model_name=settings.JUDGE_MODEL or "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
                api_key=settings.JUDGE_API_KEY or settings.NVIDIA_API_KEY,
                base_url=settings.JUDGE_BASE_URL or settings.NVIDIA_BASE_URL,
            )
        else:
            self.provider = None

    async def evaluate_consensus(
        self,
        patient_case: PatientCase,
        assessments: Dict[str, ModelAssessmentOutput],
        consensus: ConsensusOutput,
    ) -> JudgeOutput:
        """Synthesizes the multi-model assessments and consensus output."""
        if settings.MOCK_MODE or self.provider is None:
            return self._mock_judge_evaluation(patient_case, assessments, consensus)

        prompt = self._build_judge_prompt(patient_case, assessments, consensus)
        try:
            output: JudgeOutput = await self.provider.generate_structured(
                prompt=prompt,
                schema=JudgeOutput,
                system_instruction=JUDGE_SYSTEM_INSTRUCTION,
                temperature=0.2,
            )
            return output
        except Exception as e:
            logger.warning(f"AI Judge live call failed: {e}. Falling back to deterministic synthesis.")
            return self._mock_judge_evaluation(patient_case, assessments, consensus)

    def _build_judge_prompt(
        self,
        patient_case: PatientCase,
        assessments: Dict[str, ModelAssessmentOutput],
        consensus: ConsensusOutput,
    ) -> str:
        """Constructs the prompt given to the AI Judge."""
        assessments_dict = {
            m_id: a.model_dump() for m_id, a in assessments.items()
        }
        return f"""### PATIENT CASE:
{json.dumps(patient_case.to_minimized_payload(), indent=2)}

### INDEPENDENT MODEL ASSESSMENTS (3 Models):
{json.dumps(assessments_dict, indent=2)}

### DETERMINISTIC CONSENSUS ENGINE OUTPUT:
{json.dumps(consensus.model_dump(), indent=2)}

Please review these inputs and provide an objective, synthesized clinical judge evaluation. Return valid JSON only."""

    def _mock_judge_evaluation(
        self,
        patient_case: PatientCase,
        assessments: Dict[str, ModelAssessmentOutput],
        consensus: ConsensusOutput,
    ) -> JudgeOutput:
        """Deterministic, rule-based clinical judge synthesis for mock mode."""
        leading = consensus.leading_condition
        agreement = consensus.model_agreement
        level = consensus.agreement_level

        # Compile missing info across models
        missing_set = set()
        for a in assessments.values():
            for m in a.missing_information:
                missing_set.add(m)

        if level == "high":
            summary = (
                f"All available AI models reached strong consensus identifying '{leading}' as the leading possible condition "
                f"based on the reported clinical presentation ({patient_case.main_complaint or 'reported symptoms'})."
            )
            agreement_exp = (
                f"Models unanimously ({agreement}) noted consistent supporting factors including duration of "
                f"'{patient_case.duration or 'recent onset'}' and symptom characteristics."
            )
            disagreement_exp = None
            specialty = "General Physician"
            next_step = "Consider consulting a qualified healthcare professional or telehealth physician for in-person confirmation."

        elif level == "moderate":
            summary = (
                f"A majority of models ({agreement}) identified '{leading}' as the primary possibility. "
                "However, alternative etiologies were also proposed due to overlapping symptom profiles."
            )
            agreement_exp = (
                f"The majority agreement reflects typical features of {leading} matching the patient's primary complaint."
            )
            disagreement_exp = (
                f"Dissenting models highlighted alternative considerations ({'; '.join(consensus.disagreements)}) "
                "which warrant clinical differentiation during physical examination."
            )
            specialty = "General Physician"
            next_step = "A clinical consultation is recommended to evaluate competing possibilities and confirm diagnosis."

        else:  # low agreement
            summary = (
                f"AI models produced divergent assessments ({agreement} agreement) regarding the primary cause of symptoms. "
                f"'{leading}' is noted as one possibility, but significant clinical ambiguity remains."
            )
            agreement_exp = "No single clinical condition achieved majority agreement among the independent models."
            disagreement_exp = (
                f"Model divergence observed: {'; '.join(consensus.disagreements)}. "
                "This typically occurs when symptoms are non-specific or span multiple physiological systems."
            )
            specialty = "Internal Medicine / General Physician"
            next_step = "An in-person medical evaluation and objective diagnostic workup are advised given the differential uncertainty."

        return JudgeOutput(
            synthesized_summary=summary,
            agreement_explanation=agreement_exp,
            disagreement_explanation=disagreement_exp,
            missing_information=list(missing_set) if missing_set else ["Physical examination", "Routine vitals"],
            recommended_specialty=specialty,
            recommended_next_step=next_step,
        )


# Global singleton AI judge
ai_judge = AIJudge()
