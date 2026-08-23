"""Configuration definitions for Multi-LLM Medical Assessment.

Enables swappable configuration for Model A, Model B, and Model C.
Allows changing providers, models, timeouts, retry parameters, and mock modes
without modifying the rest of the application.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from backend.app.utils.config import settings


class ModelConfig(BaseModel):
    """Configuration for an individual assessment LLM provider model."""
    model_id: str = Field(
        ...,
        description="Unique identifier for the model slot (e.g. 'model_a', 'model_b', 'model_c')."
    )
    display_name: str = Field(
        ...,
        description="Human-readable title (e.g. 'Model A (Gemini 1.5 Flash)')."
    )
    provider: str = Field(
        ...,
        description="Provider adapter type: 'gemini', 'openai', 'anthropic', 'mock', or custom registered adapter."
    )
    model_name: str = Field(
        ...,
        description="Model identifier string passed to the provider API (e.g. 'gemini-1.5-flash', 'gpt-4o-mini')."
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Server-side provider API key. Kept strictly on the backend."
    )
    base_url: Optional[str] = Field(
        default=None,
        description="Optional override URL for API endpoints or mock servers."
    )
    temperature: float = Field(
        default=0.2,
        ge=0.0,
        le=1.0,
        description="Sampling temperature for deterministic clinical reasoning."
    )
    max_tokens: int = Field(
        default=1500,
        description="Maximum tokens for assessment response."
    )
    timeout_seconds: float = Field(
        default=20.0,
        gt=0.0,
        description="Per-model network timeout in seconds."
    )
    max_retries: int = Field(
        default=1,
        ge=0,
        description="Maximum retries on transient errors (e.g. rate limits)."
    )
    mock_mode: bool = Field(
        default=False,
        description="Whether this model runs in offline simulated mock mode."
    )
    specialty_bias: Optional[str] = Field(
        default=None,
        description="Optional clinical perspective for mock diversity ('primary_care', 'internal_medicine', 'urgent_care')."
    )
    extra_headers: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional extra HTTP headers."
    )

    model_config = ConfigDict(arbitrary_types_allowed=True, extra="allow")


class MultiModelAssessmentConfig(BaseModel):
    """Top-level orchestration settings for the Multi-LLM Medical Assessor."""
    models: List[ModelConfig] = Field(
        default_factory=list,
        description="List of configured LLM models to query concurrently."
    )
    overall_timeout_seconds: float = Field(
        default=30.0,
        gt=0.0,
        description="Maximum wall-clock duration for the entire multi-model assessment run."
    )
    concurrency_limit: int = Field(
        default=5,
        ge=1,
        description="Maximum number of parallel model requests."
    )
    continue_on_failure: bool = Field(
        default=True,
        description="If True, proceeds with remaining models if one or more fail."
    )
    save_raw_outputs: bool = Field(
        default=True,
        description="Whether to retain raw provider outputs in the backend audit store."
    )

    model_config = ConfigDict(arbitrary_types_allowed=True)


def get_default_model_configs() -> List[ModelConfig]:
    """Generates default Model A, Model B, and Model C configurations.
    
    Dynamically respects settings.MOCK_MODE or falls back to mock if API keys are missing.
    """
    global_mock = getattr(settings, "MOCK_MODE", True)

    # Model A: Gemini
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    model_a_mock = global_mock or not bool(gemini_key)
    model_a = ModelConfig(
        model_id="model_a",
        display_name="Model A (Gemini 1.5 Flash)" if not model_a_mock else "Model A (Primary Care Assessor)",
        provider="mock" if model_a_mock else "gemini",
        model_name=getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash"),
        api_key=gemini_key if not model_a_mock else None,
        temperature=0.2,
        timeout_seconds=20.0,
        mock_mode=model_a_mock,
        specialty_bias="primary_care",
    )

    # Model B: OpenAI
    openai_key = getattr(settings, "OPENAI_API_KEY", "")
    model_b_mock = global_mock or not bool(openai_key)
    model_b = ModelConfig(
        model_id="model_b",
        display_name="Model B (GPT-4o Mini)" if not model_b_mock else "Model B (Internal Medicine Assessor)",
        provider="mock" if model_b_mock else "openai",
        model_name=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
        api_key=openai_key if not model_b_mock else None,
        temperature=0.2,
        timeout_seconds=20.0,
        mock_mode=model_b_mock,
        specialty_bias="internal_medicine",
    )

    # Model C: Anthropic
    anthropic_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    model_c_mock = global_mock or not bool(anthropic_key)
    model_c = ModelConfig(
        model_id="model_c",
        display_name="Model C (Claude 3.5 Sonnet)" if not model_c_mock else "Model C (Urgent Care & Triage Assessor)",
        provider="mock" if model_c_mock else "anthropic",
        model_name=getattr(settings, "ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
        api_key=anthropic_key if not model_c_mock else None,
        temperature=0.2,
        timeout_seconds=25.0,
        mock_mode=model_c_mock,
        specialty_bias="urgent_care",
    )

    return [model_a, model_b, model_c]


def get_default_multi_model_config() -> MultiModelAssessmentConfig:
    """Returns the default orchestration configuration with 3 concurrent models."""
    return MultiModelAssessmentConfig(
        models=get_default_model_configs(),
        overall_timeout_seconds=30.0,
        concurrency_limit=5,
        continue_on_failure=True,
        save_raw_outputs=True,
    )
