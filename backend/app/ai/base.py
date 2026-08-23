"""Base LLM Provider Interface for HealthAssist Multi-LLM Orchestration.

Provides a common interface for Gemini, NVIDIA, Ollama, and third-party models.
Prevents direct application dependency on provider-specific SDKs.
"""

import abc
import json
import re
from typing import Optional, Type, TypeVar, Dict, Any
from pydantic import BaseModel, ValidationError

from backend.app.utils.logger import logger

T = TypeVar("T", bound=BaseModel)


class LLMProviderException(Exception):
    """Base exception for provider errors."""
    def __init__(self, message: str, provider: str = "unknown", status_code: Optional[int] = None, error_type: str = "provider_error"):
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code
        self.error_type = error_type


class LLMTimeoutException(LLMProviderException):
    def __init__(self, message: str = "LLM request timed out", provider: str = "unknown"):
        super().__init__(message, provider=provider, status_code=408, error_type="timeout")


class LLMRateLimitException(LLMProviderException):
    def __init__(self, message: str = "LLM rate limit exceeded (HTTP 429)", provider: str = "unknown"):
        super().__init__(message, provider=provider, status_code=429, error_type="rate_limit")


class LLMInvalidJSONException(LLMProviderException):
    def __init__(self, message: str = "LLM returned invalid or unparseable JSON", provider: str = "unknown"):
        super().__init__(message, provider=provider, status_code=422, error_type="invalid_json")


class LLMUnavailableException(LLMProviderException):
    def __init__(self, message: str = "LLM provider or runtime is unavailable/offline", provider: str = "unknown"):
        super().__init__(message, provider=provider, status_code=503, error_type="unavailable")


def extract_and_parse_json(raw_text: Optional[str], schema: Optional[Type[T]] = None) -> Any:
    """Extracts JSON substring, strips markdown codeblocks, and validates against Pydantic schema."""
    if not raw_text or not raw_text.strip():
        raise LLMInvalidJSONException("Response text is empty")

    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Search for matching JSON object / array if narrative surrounded
    match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if match:
        text = match.group(1)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        # Attempt auto-repair of truncated JSON string (close open strings, arrays, objects)
        repaired_text = text.strip()
        # Remove trailing unclosed key or comma
        repaired_text = re.sub(r',\s*$', '', repaired_text)
        repaired_text = re.sub(r':\s*"[^"]*$', ': ""', repaired_text)
        # Count open braces and brackets
        open_braces = repaired_text.count('{') - repaired_text.count('}')
        open_brackets = repaired_text.count('[') - repaired_text.count(']')
        if repaired_text.endswith('"') is False and repaired_text.count('"') % 2 != 0:
            repaired_text += '"'
        if open_brackets > 0:
            repaired_text += ']' * open_brackets
        if open_braces > 0:
            repaired_text += '}' * open_braces

        try:
            parsed = json.loads(repaired_text)
            logger.info("Successfully auto-repaired truncated JSON response from LLM.")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to decode JSON: {e} | Raw text snippet: {raw_text[:200]}")
            raise LLMInvalidJSONException(f"JSON decode failed: {str(e)}")

    if schema is not None:
        if isinstance(parsed, dict):
            schema_name = getattr(schema, "__name__", "")
            # Normalization for IntakeTurnOutput
            if schema_name == "IntakeTurnOutput":
                if "assistant_message" not in parsed:
                    parsed["assistant_message"] = (
                        parsed.get("message")
                        or parsed.get("reply")
                        or parsed.get("response")
                        or parsed.get("text")
                        or "Thank you for sharing your symptoms. Please provide details on duration and severity."
                    )
                if "information_complete" not in parsed:
                    parsed["information_complete"] = parsed.get("complete", False)
                if "patient_case" not in parsed or not isinstance(parsed.get("patient_case"), dict):
                    parsed["patient_case"] = {
                        "main_complaint": parsed.get("main_complaint") or parsed.get("chief_complaint") or "General Symptoms",
                        "symptoms": parsed.get("symptoms") or ["reported symptoms"],
                        "duration": parsed.get("duration"),
                        "severity": parsed.get("severity"),
                        "red_flags": parsed.get("red_flags") or [],
                    }

            # Normalization for ModelAssessmentOutput
            elif schema_name == "ModelAssessmentOutput":
                if "possible_conditions" not in parsed:
                    parsed["possible_conditions"] = (
                        parsed.get("conditions") or parsed.get("differentials") or []
                    )
                if "recommended_specialty" not in parsed:
                    parsed["recommended_specialty"] = (
                        parsed.get("specialty") or parsed.get("specialist") or "General Physician"
                    )
                if "missing_information" not in parsed:
                    parsed["missing_information"] = parsed.get("missing_info") or []
                if "red_flags" not in parsed:
                    parsed["red_flags"] = []
                if "severity" not in parsed:
                    parsed["severity"] = "moderate"

        try:
            return schema.model_validate(parsed)
        except ValidationError as ve:
            logger.warning(f"Pydantic validation failed: {ve}")
            raise LLMInvalidJSONException(f"Schema validation failed: {str(ve)}")

    return parsed


class BaseLLMProvider(abc.ABC):
    """Abstract interface for all LLM providers in HealthAssist."""

    def __init__(self, model_name: str, api_key: Optional[str] = None, base_url: Optional[str] = None, timeout_seconds: float = 25.0):
        self.model_name = model_name
        self.api_key = api_key or ""
        self.base_url = base_url or ""
        self.timeout_seconds = timeout_seconds

    @abc.abstractmethod
    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """Generates raw text response."""
        pass

    @abc.abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> T:
        """Generates validated structured response adhering strictly to Pydantic schema."""
        pass
