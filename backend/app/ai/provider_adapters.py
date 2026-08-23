"""Provider Adapters for Multi-LLM Medical Assessment.

Enables swappable provider architectures (Gemini, OpenAI, Anthropic, Mock)
so any model provider can be substituted without changing the core application.
Handles timeouts, rate limits, invalid JSON, provider outages, and missing responses.
"""

import abc
import asyncio
import json
import re
from typing import Dict, Any, Optional, Tuple, Type, List
import httpx
from pydantic import ValidationError

from backend.app.schemas.intake import PatientCase
from backend.app.schemas.medical_assessment import (
    PossibleCondition,
    ModelAssessmentOutput,
)
from backend.app.ai.model_config import ModelConfig
from backend.app.utils.logger import logger


MEDICAL_ASSESSMENT_SYSTEM_INSTRUCTION = """You are an expert Clinical AI Medical Assessor for HealthAssist.
You are evaluating a structured patient case to provide an objective clinical differential assessment.

PRIMARY DIRECTIVES & CONSTRAINTS:
1. Provide a list of POSSIBLE CONDITIONS that could explain the patient's symptoms.
2. IMPORTANT: These are possible conditions, NOT definitive diagnoses.
3. For each condition:
   - "name": Standard clinical condition name.
   - "assessment_score": A numerical relevance score between 1 and 100 indicating relative assessment weight.
     NOTE: Do NOT represent this score as a clinical probability or guaranteed likelihood.
   - "supporting_factors": Specific symptoms, onset characteristics, duration, or risk factors from the case that support this condition.
   - "contradicting_factors": Factors from the case that make this condition less likely or atypical.
   - "missing_information": Diagnostic tests, clinical examinations, or vital signs needed to further evaluate this condition.
4. "severity": Overall clinical severity assessment ('mild', 'moderate', 'severe', or 'critical').
5. "red_flags": List any acute red-flag symptoms or warning signs requiring emergency/urgent medical evaluation.
6. "recommended_specialty": The most relevant clinical specialty (e.g., 'Pulmonology', 'Cardiology', 'Internal Medicine', 'Primary Care', 'Emergency Medicine').

OUTPUT FORMAT:
You MUST return ONLY a valid JSON object matching this exact schema:
{
  "possible_conditions": [
    {
      "name": "Condition Name",
      "assessment_score": 85,
      "supporting_factors": ["symptom a", "duration b"],
      "contradicting_factors": ["absence of fever"],
      "missing_information": ["chest x-ray", "spirometry"]
    }
  ],
  "severity": "mild",
  "red_flags": [],
  "recommended_specialty": "Primary Care"
}
Do not include any conversational preamble, markdown outside the JSON, or markdown codeblocks."""


class ProviderException(Exception):
    """Base exception for provider adapter errors."""
    def __init__(self, message: str, error_type: str = "provider_error", status_code: Optional[int] = None):
        super().__init__(message)
        self.error_type = error_type
        self.status_code = status_code


class ProviderTimeoutException(ProviderException):
    def __init__(self, message: str = "Request timed out waiting for provider response"):
        super().__init__(message, error_type="timeout", status_code=408)


class ProviderRateLimitException(ProviderException):
    def __init__(self, message: str = "Provider rate limit exceeded (HTTP 429)"):
        super().__init__(message, error_type="rate_limit", status_code=429)


class ProviderInvalidJSONException(ProviderException):
    def __init__(self, message: str = "Provider returned invalid or malformed JSON"):
        super().__init__(message, error_type="invalid_json", status_code=422)


class ProviderMissingResponseException(ProviderException):
    def __init__(self, message: str = "Provider returned empty or missing response"):
        super().__init__(message, error_type="missing_response", status_code=502)


class BaseProviderAdapter(abc.ABC):
    """Abstract interface for medical assessment provider adapters."""

    def __init__(self, config: ModelConfig):
        self.config = config

    @abc.abstractmethod
    async def evaluate_case(
        self,
        patient_case: PatientCase,
        system_instruction: Optional[str] = None,
    ) -> Tuple[ModelAssessmentOutput, Dict[str, Any]]:
        """Evaluates a normalized patient case and returns parsed output and raw response dict.
        
        Raises ProviderException subclasses on failures.
        """
        pass

    def format_patient_case_prompt(self, case: PatientCase) -> str:
        """Formats the normalized PatientCase into an identical prompt across all models."""
        symptoms_str = ", ".join(case.symptoms) if case.symptoms else "None reported"
        associated_str = ", ".join(case.associated_symptoms) if case.associated_symptoms else "None reported"
        red_flags_str = ", ".join(case.red_flags) if case.red_flags else "None identified"

        return f"""### PATIENT CLINICAL CASE FOR MEDICAL ASSESSMENT:
- Chief / Main Complaint: {case.main_complaint or 'Unspecified'}
- Reported Symptoms: {symptoms_str}
- Duration: {case.duration or 'Not specified'}
- Severity / Pain Rating: {case.severity if case.severity is not None else 'Not rated'}
- Onset Characteristics: {case.onset or 'Not specified'}
- Associated Symptoms: {associated_str}
- Red-Flag Symptoms Screened: {red_flags_str}

Please perform an independent clinical assessment of possible conditions, supporting/contradicting factors, missing diagnostic information, overall severity, red flags, and recommended clinical specialty. Return valid JSON only."""

    def clean_and_parse_json(self, raw_text: Optional[str]) -> Tuple[ModelAssessmentOutput, Dict[str, Any]]:
        """Cleans, parses, and validates JSON against the ModelAssessmentOutput schema."""
        if not raw_text or not raw_text.strip():
            raise ProviderMissingResponseException("Provider returned empty response content.")

        text = raw_text.strip()
        # Strip markdown codeblocks if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Extract JSON object substring if embedded in narrative
        json_match = re.search(r"(\{.*\})", text, re.DOTALL)
        if json_match:
            text = json_match.group(1)

        try:
            parsed_dict = json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"[{self.config.model_id}] JSONDecodeError: {e} | Raw text: {raw_text[:200]}")
            raise ProviderInvalidJSONException(f"Failed to decode JSON: {str(e)}")

        if not isinstance(parsed_dict, dict):
            raise ProviderInvalidJSONException("Provider response is not a valid JSON dictionary.")

        # Ensure required keys exist or default gracefully
        if "possible_conditions" not in parsed_dict:
            parsed_dict["possible_conditions"] = []
        if "severity" not in parsed_dict or not parsed_dict["severity"]:
            parsed_dict["severity"] = "moderate"
        if "red_flags" not in parsed_dict:
            parsed_dict["red_flags"] = []
        if "recommended_specialty" not in parsed_dict or not parsed_dict["recommended_specialty"]:
            parsed_dict["recommended_specialty"] = "Primary Care"

        try:
            output = ModelAssessmentOutput.model_validate(parsed_dict)
            return output, parsed_dict
        except ValidationError as e:
            logger.warning(f"[{self.config.model_id}] Pydantic schema validation error: {e}")
            raise ProviderInvalidJSONException(f"Response schema validation failed: {str(e)}")


class GeminiProviderAdapter(BaseProviderAdapter):
    """Adapter for Google Gemini Generative Language API."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.api_key = config.api_key or ""
        self.model_name = config.model_name or "gemini-1.5-flash"
        self.base_url = (
            config.base_url
            or f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        )

    async def evaluate_case(
        self,
        patient_case: PatientCase,
        system_instruction: Optional[str] = None,
    ) -> Tuple[ModelAssessmentOutput, Dict[str, Any]]:
        prompt = self.format_patient_case_prompt(patient_case)
        sys_inst = system_instruction or MEDICAL_ASSESSMENT_SYSTEM_INSTRUCTION

        url = f"{self.base_url}?key={self.api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": sys_inst}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": self.config.temperature,
                "maxOutputTokens": self.config.max_tokens,
            },
        }

        timeout = httpx.Timeout(self.config.timeout_seconds)
        attempts = 0
        max_attempts = max(1, self.config.max_retries + 1)

        while attempts < max_attempts:
            attempts += 1
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=payload)

                    if resp.status_code == 429:
                        if attempts < max_attempts:
                            await asyncio.sleep(1.0 * attempts)
                            continue
                        raise ProviderRateLimitException("Gemini rate limit exceeded (HTTP 429).")

                    if resp.status_code >= 500:
                        if attempts < max_attempts:
                            await asyncio.sleep(1.0 * attempts)
                            continue
                        raise ProviderException(
                            f"Gemini server error (HTTP {resp.status_code})",
                            error_type="provider_error",
                            status_code=resp.status_code,
                        )

                    resp.raise_for_status()
                    data = resp.json()

                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ProviderMissingResponseException("Gemini returned no candidates in response.")

                    text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return self.clean_and_parse_json(text_content)

            except httpx.TimeoutException:
                if attempts < max_attempts:
                    continue
                raise ProviderTimeoutException(f"Gemini request timed out after {self.config.timeout_seconds}s.")
            except httpx.HTTPStatusError as e:
                raise ProviderException(f"Gemini HTTP error: {e.response.status_code}", error_type="provider_error")
            except (ProviderException, ProviderTimeoutException, ProviderRateLimitException):
                raise
            except Exception as e:
                raise ProviderException(f"Gemini execution failure: {str(e)}", error_type="provider_error")


class OpenAIProviderAdapter(BaseProviderAdapter):
    """Adapter for OpenAI Chat Completions API."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.api_key = config.api_key or ""
        self.model_name = config.model_name or "gpt-4o-mini"
        self.base_url = config.base_url or "https://api.openai.com/v1/chat/completions"

    async def evaluate_case(
        self,
        patient_case: PatientCase,
        system_instruction: Optional[str] = None,
    ) -> Tuple[ModelAssessmentOutput, Dict[str, Any]]:
        prompt = self.format_patient_case_prompt(patient_case)
        sys_inst = system_instruction or MEDICAL_ASSESSMENT_SYSTEM_INSTRUCTION

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.config.extra_headers:
            headers.update(self.config.extra_headers)

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": sys_inst},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }

        timeout = httpx.Timeout(self.config.timeout_seconds)
        attempts = 0
        max_attempts = max(1, self.config.max_retries + 1)

        while attempts < max_attempts:
            attempts += 1
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(self.base_url, json=payload, headers=headers)

                    if resp.status_code == 429:
                        if attempts < max_attempts:
                            await asyncio.sleep(1.0 * attempts)
                            continue
                        raise ProviderRateLimitException("OpenAI rate limit exceeded (HTTP 429).")

                    if resp.status_code >= 500:
                        if attempts < max_attempts:
                            await asyncio.sleep(1.0 * attempts)
                            continue
                        raise ProviderException(
                            f"OpenAI server error (HTTP {resp.status_code})",
                            error_type="provider_error",
                            status_code=resp.status_code,
                        )

                    resp.raise_for_status()
                    data = resp.json()

                    choices = data.get("choices", [])
                    if not choices:
                        raise ProviderMissingResponseException("OpenAI returned no choices.")

                    text_content = choices[0].get("message", {}).get("content", "")
                    return self.clean_and_parse_json(text_content)

            except httpx.TimeoutException:
                if attempts < max_attempts:
                    continue
                raise ProviderTimeoutException(f"OpenAI request timed out after {self.config.timeout_seconds}s.")
            except (ProviderException, ProviderTimeoutException, ProviderRateLimitException):
                raise
            except Exception as e:
                raise ProviderException(f"OpenAI execution failure: {str(e)}", error_type="provider_error")


class AnthropicProviderAdapter(BaseProviderAdapter):
    """Adapter for Anthropic Claude API."""

    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.api_key = config.api_key or ""
        self.model_name = config.model_name or "claude-3-5-sonnet-20241022"
        self.base_url = config.base_url or "https://api.anthropic.com/v1/messages"

    async def evaluate_case(
        self,
        patient_case: PatientCase,
        system_instruction: Optional[str] = None,
    ) -> Tuple[ModelAssessmentOutput, Dict[str, Any]]:
        prompt = self.format_patient_case_prompt(patient_case)
        sys_inst = (
            f"{system_instruction or MEDICAL_ASSESSMENT_SYSTEM_INSTRUCTION}\n\n"
            "STRICT REQUIREMENT: Respond ONLY with valid JSON. Do not include markdown tags or explanation."
        )

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        if self.config.extra_headers:
            headers.update(self.config.extra_headers)

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "system": sys_inst,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
        }

        timeout = httpx.Timeout(self.config.timeout_seconds)
        attempts = 0
        max_attempts = max(1, self.config.max_retries + 1)

        while attempts < max_attempts:
            attempts += 1
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(self.base_url, json=payload, headers=headers)

                    if resp.status_code == 429:
                        if attempts < max_attempts:
                            await asyncio.sleep(1.0 * attempts)
                            continue
                        raise ProviderRateLimitException("Anthropic rate limit exceeded (HTTP 429).")

                    if resp.status_code >= 500:
                        if attempts < max_attempts:
                            await asyncio.sleep(1.0 * attempts)
                            continue
                        raise ProviderException(
                            f"Anthropic server error (HTTP {resp.status_code})",
                            error_type="provider_error",
                            status_code=resp.status_code,
                        )

                    resp.raise_for_status()
                    data = resp.json()

                    contents = data.get("content", [])
                    if not contents:
                        raise ProviderMissingResponseException("Anthropic returned empty content.")

                    text_content = contents[0].get("text", "")
                    return self.clean_and_parse_json(text_content)

            except httpx.TimeoutException:
                if attempts < max_attempts:
                    continue
                raise ProviderTimeoutException(f"Anthropic request timed out after {self.config.timeout_seconds}s.")
            except (ProviderException, ProviderTimeoutException, ProviderRateLimitException):
                raise
            except Exception as e:
                raise ProviderException(f"Anthropic execution failure: {str(e)}", error_type="provider_error")


class MockProviderAdapter(BaseProviderAdapter):
    """High-fidelity clinical mock provider adapter.
    
    Generates realistic, symptom-tailored differential conditions for offline testing.
    Supports failure simulation for testing error resilience.
    """

    def __init__(self, config: ModelConfig, simulated_failure: Optional[str] = None):
        super().__init__(config)
        self.simulated_failure = simulated_failure

    async def evaluate_case(
        self,
        patient_case: PatientCase,
        system_instruction: Optional[str] = None,
    ) -> Tuple[ModelAssessmentOutput, Dict[str, Any]]:
        # Simulate slight network latency for realistic concurrency testing
        await asyncio.sleep(0.05)

        # Handle failure simulations for test harness
        if self.simulated_failure == "timeout":
            raise ProviderTimeoutException("Simulated provider timeout.")
        elif self.simulated_failure == "rate_limit":
            raise ProviderRateLimitException("Simulated rate limit exceeded (429).")
        elif self.simulated_failure == "invalid_json":
            raise ProviderInvalidJSONException("Simulated malformed JSON response.")
        elif self.simulated_failure == "missing_response":
            raise ProviderMissingResponseException("Simulated missing response payload.")
        elif self.simulated_failure == "provider_error":
            raise ProviderException("Simulated internal provider 500 error.")

        # Clinical symptom keyword analysis
        symptoms_lower = " ".join(patient_case.symptoms).lower()
        complaint_lower = (patient_case.main_complaint or "").lower()
        all_text = f"{complaint_lower} {symptoms_lower} {' '.join(patient_case.associated_symptoms).lower()}"

        conditions: List[PossibleCondition] = []
        severity = "moderate"
        red_flags: List[str] = list(patient_case.red_flags or [])
        recommended_specialty = "Primary Care"

        bias = self.config.specialty_bias or "primary_care"

        # 1. Respiratory / Cough / Cold / Throat
        if any(k in all_text for k in ["cough", "throat", "fever", "congestion", "cold", "flu"]):
            if bias == "primary_care":
                conditions.append(
                    PossibleCondition(
                        name="Upper Respiratory Tract Infection (Viral URI)",
                        assessment_score=85,
                        supporting_factors=["Cough and throat irritation", f"Duration of {patient_case.duration or 'recent onset'}"],
                        contradicting_factors=["Absence of severe dyspnea" if "shortness of breath" not in all_text else "None"],
                        missing_information=["Rapid antigen test", "Oropharyngeal examination"],
                    )
                )
                conditions.append(
                    PossibleCondition(
                        name="Acute Viral Bronchitis",
                        assessment_score=70,
                        supporting_factors=["Persistent cough", "Chest discomfort on coughing"],
                        contradicting_factors=["No documented focal lung crackles"],
                        missing_information=["Lung auscultation", "Chest X-ray if symptoms persist"],
                    )
                )
                recommended_specialty = "Family Medicine"
            elif bias == "internal_medicine":
                conditions.append(
                    PossibleCondition(
                        name="Acute Bronchitis",
                        assessment_score=80,
                        supporting_factors=["Cough presentation", f"Severity level: {patient_case.severity or 'moderate'}"],
                        contradicting_factors=["No hemoptysis reported"],
                        missing_information=["Pulse oximetry", "Complete Blood Count (CBC)"],
                    )
                )
                conditions.append(
                    PossibleCondition(
                        name="Allergic Rhinitis with Post-Nasal Drip",
                        assessment_score=65,
                        supporting_factors=["Congestion and scratchy throat"],
                        contradicting_factors=["Presence of systemic fever" if "fever" in all_text else "None"],
                        missing_information=["Allergy history", "Nasal endoscopy"],
                    )
                )
                recommended_specialty = "Internal Medicine"
            else:  # urgent_care / triage
                conditions.append(
                    PossibleCondition(
                        name="Viral Pharyngitis / Upper Respiratory Syndrome",
                        assessment_score=82,
                        supporting_factors=["Sore throat and respiratory symptoms"],
                        contradicting_factors=["No airway compromise or stridor"],
                        missing_information=["Centor score assessment", "Throat swab culture"],
                    )
                )
                if "fever" in all_text or "chest" in all_text:
                    conditions.append(
                        PossibleCondition(
                            name="Early Community-Acquired Pneumonia",
                            assessment_score=60,
                            supporting_factors=["Fever and lower respiratory involvement"],
                            contradicting_factors=["Absence of severe hypoxia"],
                            missing_information=["Chest Radiograph (PA & Lateral)", "SpO2 reading"],
                        )
                    )
                recommended_specialty = "Pulmonology"

        # 2. Chest Pain / Cardiovascular / Dyspnea
        elif any(k in all_text for k in ["chest pain", "chest pressure", "shortness of breath", "palpitations"]):
            red_flags.append("Acute chest discomfort requiring urgent triage")
            severity = "severe"
            if bias == "urgent_care":
                conditions.append(
                    PossibleCondition(
                        name="Acute Coronary Syndrome (ACS) Rule-Out",
                        assessment_score=90,
                        supporting_factors=["Chest pressure / discomfort", "Potential cardiovascular risk presentation"],
                        contradicting_factors=["Non-exertional onset" if "exertion" not in all_text else "None"],
                        missing_information=["12-Lead ECG", "Serial Troponin-I assays"],
                    )
                )
                conditions.append(
                    PossibleCondition(
                        name="Gastroesophageal Reflux Disease (GERD) / Esophageal Spasm",
                        assessment_score=65,
                        supporting_factors=["Retrosternal chest discomfort"],
                        contradicting_factors=["Acute presentation requires first excluding cardiac etiology"],
                        missing_information=["Response to antacid trial", "Upper endoscopy"],
                    )
                )
                recommended_specialty = "Emergency Medicine"
            else:
                conditions.append(
                    PossibleCondition(
                        name="Atypical Chest Discomfort / Musculoskeletal Chest Wall Pain",
                        assessment_score=75,
                        supporting_factors=["Localized chest area symptoms"],
                        contradicting_factors=["Absence of radiation to left jaw/arm" if "radiation" not in all_text else "None"],
                        missing_information=["Palpation of chest wall", "ECG"],
                    )
                )
                recommended_specialty = "Cardiology"

        # 3. Headache / Neurological
        elif any(k in all_text for k in ["headache", "migraine", "dizziness", "head pressure"]):
            if bias == "internal_medicine":
                conditions.append(
                    PossibleCondition(
                        name="Tension-Type Headache",
                        assessment_score=85,
                        supporting_factors=["Band-like head discomfort", f"Duration: {patient_case.duration or 'recent'}"],
                        contradicting_factors=["No focal neurological deficits"],
                        missing_information=["Fundoscopic examination", "Blood pressure measurement"],
                    )
                )
                conditions.append(
                    PossibleCondition(
                        name="Migraine without Aura",
                        assessment_score=72,
                        supporting_factors=["Moderate to severe headache intensity"],
                        contradicting_factors=["No documented unilateral throbbing" if "throbbing" not in all_text else "None"],
                        missing_information=["History of photophobia/phonophobia"],
                    )
                )
                recommended_specialty = "Neurology"
            else:
                conditions.append(
                    PossibleCondition(
                        name="Primary Tension Cephalea",
                        assessment_score=80,
                        supporting_factors=["Bilateral head aching sensation"],
                        contradicting_factors=["Absence of sudden thunderclap onset"],
                        missing_information=["Cranial nerve screen"],
                    )
                )
                recommended_specialty = "Primary Care"

        # 4. Abdominal / GI
        elif any(k in all_text for k in ["abdominal", "stomach", "nausea", "vomiting", "cramps", "diarrhea"]):
            conditions.append(
                PossibleCondition(
                    name="Acute Viral Gastroenteritis",
                    assessment_score=80,
                    supporting_factors=["Gastrointestinal distress", "Abdominal discomfort"],
                    contradicting_factors=["No peritoneal signs or rebound tenderness"],
                    missing_information=["Abdominal ultrasound", "Stool microscopy"],
                )
            )
            conditions.append(
                PossibleCondition(
                    name="Functional Dyspepsia / Gastritis",
                    assessment_score=68,
                    supporting_factors=["Epigastric or abdominal irritation"],
                    contradicting_factors=["No hematemesis or melena"],
                    missing_information=["H. Pylori antigen test", "Dietary correlation history"],
                )
            )
            recommended_specialty = "Gastroenterology"

        # 5. Default / General Case
        else:
            complaint_title = (patient_case.main_complaint or "General Clinical Symptoms").capitalize()
            conditions.append(
                PossibleCondition(
                    name=f"Etiology Under Evaluation: {complaint_title}",
                    assessment_score=75,
                    supporting_factors=[f"Reported symptoms: {symptoms_str}"],
                    contradicting_factors=["Atypical or non-specific clinical presentation"],
                    missing_information=["Comprehensive in-person physical examination", "Routine metabolic panel"],
                )
            )
            conditions.append(
                PossibleCondition(
                    name="Transient Benign Symptom Complex",
                    assessment_score=60,
                    supporting_factors=["Short duration without systemic decompensation"],
                    contradicting_factors=["Requires clinical monitoring if persisting"],
                    missing_information=["Serial symptom monitoring log"],
                )
            )
            recommended_specialty = "Primary Care"

        result_dict = {
            "possible_conditions": [c.model_dump() for c in conditions],
            "severity": severity,
            "red_flags": red_flags,
            "recommended_specialty": recommended_specialty,
        }

        output = ModelAssessmentOutput.model_validate(result_dict)
        return output, result_dict


# Provider Registry
_PROVIDER_REGISTRY: Dict[str, Type[BaseProviderAdapter]] = {
    "gemini": GeminiProviderAdapter,
    "openai": OpenAIProviderAdapter,
    "anthropic": AnthropicProviderAdapter,
    "mock": MockProviderAdapter,
}


def register_provider_adapter(provider_name: str, adapter_cls: Type[BaseProviderAdapter]) -> None:
    """Registers a new provider adapter class allowing custom backends to be plugged in."""
    _PROVIDER_REGISTRY[provider_name.lower()] = adapter_cls
    logger.info(f"Registered medical assessment provider adapter: {provider_name}")


def get_provider_adapter(config: ModelConfig) -> BaseProviderAdapter:
    """Factory creating the appropriate provider adapter instance from a ModelConfig."""
    if config.mock_mode:
        return MockProviderAdapter(config)

    provider_key = config.provider.lower()
    adapter_cls = _PROVIDER_REGISTRY.get(provider_key)

    if not adapter_cls:
        logger.warning(f"Unknown provider '{config.provider}', falling back to MockProviderAdapter")
        return MockProviderAdapter(config)

    # If API key is missing for real providers, gracefully use mock
    if provider_key in ["gemini", "openai", "anthropic"] and not config.api_key:
        logger.warning(f"No API key configured for {config.provider} ({config.model_id}), falling back to MockProviderAdapter")
        return MockProviderAdapter(config)

    return adapter_cls(config)
