"""Three Independent AI Medical Assessment Coordinator.

Sends the exact same normalized PatientCase concurrently to:
- Model #1: NVIDIA (meta/llama-3.3-70b-instruct)
- Model #2: Ollama (llama3.2 runtime)
- Model #3: Model 3 (nvidia/nemotron-3-nano-omni-30b-a3b-reasoning or configured provider)

Guarantees models evaluate independently without seeing each other's answers.
"""

import asyncio
import json
from typing import Dict, List, Optional, Tuple, Any
from pydantic import ValidationError

from backend.app.ai.base import BaseLLMProvider
from backend.app.ai.nvidia_provider import NVIDIAProvider
from backend.app.ai.ollama_provider import OllamaProvider
from backend.app.ai.gemini_provider import GeminiProvider
from backend.app.ai.schemas import (
    PatientCase,
    ModelAssessmentOutput,
    PossibleCondition,
)
from backend.app.utils.config import settings
from backend.app.utils.logger import logger


ASSESSMENT_SYSTEM_INSTRUCTION = """You are an expert Clinical AI Medical Assessor.
You are evaluating a structured, anonymized patient case to provide an objective differential assessment.

CORE REQUIREMENTS:
1. Identify a list of POSSIBLE CONDITIONS that could explain the symptoms.
2. For each condition:
   - "name": Standard medical condition name.
   - "score": An AI assessment score between 1 and 100 indicating relative assessment weight.
     NOTE: This score represents assessment weight/relevance, NOT clinical or statistical probability.
   - "supporting_factors": Evidence from the case that supports this condition.
   - "contradicting_factors": Evidence or lack thereof that makes this condition less likely.
3. "severity": Overall clinical severity ('mild', 'moderate', 'severe', 'critical').
4. "red_flags": Any acute emergency symptoms identified.
5. "recommended_specialty": Appropriate medical specialty for referral (e.g., 'General Physician', 'Neurology', 'Pulmonology', 'Cardiology').
6. "missing_information": Diagnostic tests or exams needed to confirm or rule out the condition.

STRICT INSTRUCTION:
- These are possible conditions, NOT definitive diagnoses.
- Respond ONLY with a valid JSON object matching the requested schema without markdown codeblocks or narrative."""


class ThreeModelAssessor:
    """Coordinates the 3 genuinely different independent assessment models."""

    def __init__(
        self,
        model1_provider: Optional[BaseLLMProvider] = None,
        model2_provider: Optional[BaseLLMProvider] = None,
        model3_provider: Optional[BaseLLMProvider] = None,
    ):
        if not settings.MOCK_MODE:
            # Model 1: NVIDIA (Meta Llama)
            self.model1 = model1_provider or NVIDIAProvider(
                model_name=settings.NVIDIA_MODEL,
                api_key=settings.NVIDIA_API_KEY,
                base_url=settings.NVIDIA_BASE_URL,
            )
            # Model 2: Gemini or Ollama Runtime
            if getattr(settings, "ASSESSMENT_PROVIDER_2", "gemini").lower() == "gemini":
                self.model2 = model2_provider or GeminiProvider(
                    model_name=settings.GEMINI_MODEL,
                    api_key=settings.GEMINI_API_KEY,
                )
                self.model2_id = "model_2_gemini"
            else:
                self.model2 = model2_provider or OllamaProvider(
                    model_name=settings.OLLAMA_MODEL,
                    base_url=settings.OLLAMA_BASE_URL,
                    api_key=settings.OLLAMA_API_KEY,
                )
                self.model2_id = "model_2_ollama"

            # Model 3: NVIDIA Nemotron / Reasoning
            self.model3 = model3_provider or NVIDIAProvider(
                model_name=settings.MODEL3_MODEL,
                api_key=settings.MODEL3_API_KEY,
                base_url=settings.MODEL3_BASE_URL,
            )
        else:
            self.model1 = None
            self.model2 = None
            self.model3 = None
            self.model2_id = "model_2_gemini"

    def _format_assessment_prompt(self, patient_case: PatientCase) -> str:
        """Formats the normalized PatientCase into an identical prompt for all models."""
        minimized = patient_case.to_minimized_payload()
        return (
            "### STRUCTURED PATIENT CASE FOR CLINICAL ASSESSMENT:\n"
            f"{json.dumps(minimized, indent=2)}\n\n"
            "Please provide an independent differential assessment. Return valid JSON only."
        )

    async def _evaluate_single(
        self,
        model_id: str,
        provider: Optional[BaseLLMProvider],
        patient_case: PatientCase,
        mock_scenario: Optional[str] = None,
    ) -> Tuple[str, Optional[ModelAssessmentOutput]]:
        """Executes an individual model evaluation in isolation."""
        if settings.MOCK_MODE or provider is None:
            return model_id, self._generate_mock_model_output(model_id, patient_case, mock_scenario)

        prompt = self._format_assessment_prompt(patient_case)
        try:
            output: ModelAssessmentOutput = await provider.generate_structured(
                prompt=prompt,
                schema=ModelAssessmentOutput,
                system_instruction=ASSESSMENT_SYSTEM_INSTRUCTION,
                temperature=0.2,
            )
            return model_id, output
        except Exception as e:
            logger.error(f"[{model_id}] Assessment call failed: {e}. Attempting fallback.")
            # If live model fails, return None so consensus handles available models
            return model_id, None

    async def run_three_assessments(
        self,
        patient_case: PatientCase,
        mock_scenario: Optional[str] = None,
    ) -> Dict[str, ModelAssessmentOutput]:
        """Runs the 3 independent assessment models concurrently on the same normalized PatientCase."""
        prompt = self._format_assessment_prompt(patient_case)
        logger.info("Executing 3 independent model assessments concurrently...")

        # Concurrently launch Model 1 (NVIDIA), Model 2 (Gemini/Ollama), and Model 3 (NVIDIA Nemotron)
        model2_name = getattr(self, "model2_id", "model_2_gemini")
        tasks = [
            self._evaluate_single("model_1_nvidia", self.model1, patient_case, mock_scenario),
            self._evaluate_single(model2_name, self.model2, patient_case, mock_scenario),
            self._evaluate_single("model_3_nemotron", self.model3, patient_case, mock_scenario),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        successful_assessments: Dict[str, ModelAssessmentOutput] = {}
        for res in results:
            if isinstance(res, Exception):
                logger.error(f"Concurrent task error: {res}")
                continue
            if isinstance(res, tuple):
                model_id, output = res
                if output is not None:
                    successful_assessments[model_id] = output

        logger.info(f"Independent assessments complete: {len(successful_assessments)}/3 models responded.")
        return successful_assessments

    def _generate_mock_model_output(
        self,
        model_id: str,
        patient_case: PatientCase,
        scenario: Optional[str] = None,
    ) -> ModelAssessmentOutput:
        """Deterministic mock generator supporting all 4 demo scenarios."""
        all_text = " ".join([
            patient_case.main_complaint or "",
            " ".join(patient_case.symptoms or []),
            " ".join(patient_case.associated_symptoms or []),
        ]).lower()

        # Scenario 4: Safety Override / Acute Chest Pain
        if scenario == "safety_override" or any(k in all_text for k in ["chest pain", "shortness of breath"]):
            if "model_1" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(
                            name="Acute Coronary Syndrome Rule-Out",
                            score=88,
                            supporting_factors=["Retrosternal chest discomfort", "Acute onset"],
                            contradicting_factors=[],
                        ),
                        PossibleCondition(
                            name="Gastroesophageal Reflux Disease (GERD)",
                            score=60,
                            supporting_factors=["Retrosternal location"],
                            contradicting_factors=["High pain intensity"],
                        ),
                    ],
                    severity="severe",
                    red_flags=["Acute chest pain requiring emergency triage"],
                    recommended_specialty="Emergency Medicine / Cardiology",
                    missing_information=["12-lead ECG", "Serial Troponin-I assays"],
                )
            elif "model_2" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(
                            name="Acute Coronary Syndrome Rule-Out",
                            score=85,
                            supporting_factors=["Chest pressure with shortness of breath"],
                            contradicting_factors=[],
                        ),
                        PossibleCondition(
                            name="Musculoskeletal Chest Wall Pain",
                            score=55,
                            supporting_factors=["Chest area localized pain"],
                            contradicting_factors=["Presence of dyspnea"],
                        ),
                    ],
                    severity="severe",
                    red_flags=["Chest pressure"],
                    recommended_specialty="Emergency Medicine",
                    missing_information=["ECG", "Chest Radiograph"],
                )
            else:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(
                            name="Acute Coronary Syndrome Rule-Out",
                            score=90,
                            supporting_factors=["Cardiovascular risk presentation", "Acute onset"],
                            contradicting_factors=[],
                        ),
                    ],
                    severity="severe",
                    red_flags=["Potential cardiac ischemia"],
                    recommended_specialty="Cardiology / Emergency Department",
                    missing_information=["Cardiac biomarkers", "Echocardiogram"],
                )

        # Scenario 3: Strong Disagreement
        if scenario == "strong_disagree":
            if "model_1" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Migraine", score=75, supporting_factors=["Headache severity"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="Neurology",
                    missing_information=["Neurological exam"],
                )
            elif "model_2" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Tension-Type Headache", score=72, supporting_factors=["Bilateral pressure"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="General Physician",
                    missing_information=["Cranial nerve exam"],
                )
            else:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Sinusitis / Sinus Headache", score=70, supporting_factors=["Facial pressure"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="Otolaryngology (ENT)",
                    missing_information=["Nasal endoscopy"],
                )

        # Scenario 2: Partial Disagreement (2 agree, 1 differs)
        if scenario == "partial_disagree":
            if "model_1" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Migraine", score=82, supporting_factors=["Throbbing headache", "Nausea"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="Neurology",
                    missing_information=["Fundoscopic exam"],
                )
            elif "model_2" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Migraine", score=80, supporting_factors=["Severe unilateral pain"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="General Physician",
                    missing_information=["Headache history diary"],
                )
            else:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Tension-Type Headache", score=74, supporting_factors=["Steady aching head pain"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="General Physician",
                    missing_information=["Blood pressure check"],
                )

        # Scenario 1 (Default): High Agreement / Unanimous
        if any(k in all_text for k in ["headache", "migraine", "head"]):
            if "model_1" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Migraine", score=84, supporting_factors=["Throbbing headache", "Photophobia"], contradicting_factors=[]),
                        PossibleCondition(name="Tension-Type Headache", score=62, supporting_factors=["Head pain"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="Neurology",
                    missing_information=["Neurological screen", "Eye exam"],
                )
            elif "model_2" in model_id:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Migraine", score=80, supporting_factors=["Severe headache", "Nausea correlation"], contradicting_factors=[]),
                        PossibleCondition(name="Cluster Headache", score=50, supporting_factors=["Unilateral pain"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="General Physician",
                    missing_information=["Headache trigger log"],
                )
            else:
                return ModelAssessmentOutput(
                    possible_conditions=[
                        PossibleCondition(name="Migraine", score=82, supporting_factors=["Clinical symptom profile"], contradicting_factors=[]),
                    ],
                    severity="moderate",
                    red_flags=[],
                    recommended_specialty="General Physician",
                    missing_information=["Cranial nerve exam"],
                )

        # Respiratory Default
        if "model_1" in model_id:
            return ModelAssessmentOutput(
                possible_conditions=[
                    PossibleCondition(name="Viral Upper Respiratory Tract Infection", score=85, supporting_factors=["Cough and sore throat", "Gradual onset"], contradicting_factors=[]),
                    PossibleCondition(name="Acute Bronchitis", score=68, supporting_factors=["Persistent cough"], contradicting_factors=[]),
                ],
                severity="mild",
                red_flags=[],
                recommended_specialty="General Physician",
                missing_information=["Throat examination", "Temperature log"],
            )
        elif "model_2" in model_id:
            return ModelAssessmentOutput(
                possible_conditions=[
                    PossibleCondition(name="Viral Upper Respiratory Tract Infection", score=82, supporting_factors=["Congestion and throat discomfort"], contradicting_factors=[]),
                    PossibleCondition(name="Allergic Rhinitis", score=60, supporting_factors=["Nasal congestion"], contradicting_factors=[]),
                ],
                severity="mild",
                red_flags=[],
                recommended_specialty="General Physician",
                missing_information=["Allergy history"],
            )
        else:
            return ModelAssessmentOutput(
                possible_conditions=[
                    PossibleCondition(name="Viral Upper Respiratory Tract Infection", score=80, supporting_factors=["Respiratory symptom complex"], contradicting_factors=[]),
                ],
                severity="mild",
                red_flags=[],
                recommended_specialty="General Physician",
                missing_information=["Lung auscultation"],
            )


# Global singleton assessor
three_model_assessor = ThreeModelAssessor()
