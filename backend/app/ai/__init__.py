"""HealthAssist AI Module.

Exposes:
- Core LLM Providers: Gemini, NVIDIA, Ollama
- Intake AI: Gemini Conversational Intake
- Assessor: Three Independent Concurrent Assessment Models
- Consensus: Deterministic Python Consensus Engine
- Judge: AI Judge Reasoning Module
- Safety: Independent Deterministic Safety Engine
- Orchestrator: Complete Multi-LLM AI Assessment Pipeline
"""

from backend.app.ai.base import (
    BaseLLMProvider,
    LLMProviderException,
    LLMTimeoutException,
    LLMRateLimitException,
    LLMInvalidJSONException,
    LLMUnavailableException,
    extract_and_parse_json,
)
from backend.app.ai.gemini_provider import GeminiProvider
from backend.app.ai.nvidia_provider import NVIDIAProvider
from backend.app.ai.ollama_provider import OllamaProvider

from backend.app.ai.schemas import (
    PatientCase,
    IntakeTurnOutput,
    PossibleCondition,
    ModelAssessmentOutput,
    ConsensusOutput,
    JudgeOutput,
    SafetyOutput,
    FinalAssessmentOutput,
)

from backend.app.ai.intake import GeminiIntakeAI, intake_ai
from backend.app.ai.assessor import ThreeModelAssessor, three_model_assessor
from backend.app.ai.consensus import (
    DeterministicConsensusEngine,
    consensus_engine,
    normalize_condition_name,
)
from backend.app.ai.judge import AIJudge, ai_judge
from backend.app.ai.safety import SafetyEngine, safety_engine
from backend.app.ai.orchestrator import MultiLLMOrchestrator, orchestrator

# Backward compatibility exports
from backend.app.ai.triage_agent import TriageAgent
from backend.app.ai.intake_agent import IntakeAgent, intake_agent
from backend.app.ai.llm_provider import MockLLMProvider, OpenAIProvider, AnthropicProvider, get_llm_provider
from backend.app.ai.model_config import ModelConfig, MultiModelAssessmentConfig, get_default_model_configs, get_default_multi_model_config
from backend.app.ai.provider_adapters import BaseProviderAdapter, MockProviderAdapter, get_provider_adapter, register_provider_adapter
from backend.app.ai.medical_assessor import MultiLLMMedicalAssessor, medical_assessor, assess_patient_case

__all__ = [
    "BaseLLMProvider",
    "GeminiProvider",
    "NVIDIAProvider",
    "OllamaProvider",
    "PatientCase",
    "IntakeTurnOutput",
    "PossibleCondition",
    "ModelAssessmentOutput",
    "ConsensusOutput",
    "JudgeOutput",
    "SafetyOutput",
    "FinalAssessmentOutput",
    "GeminiIntakeAI",
    "intake_ai",
    "ThreeModelAssessor",
    "three_model_assessor",
    "DeterministicConsensusEngine",
    "consensus_engine",
    "normalize_condition_name",
    "AIJudge",
    "ai_judge",
    "SafetyEngine",
    "safety_engine",
    "MultiLLMOrchestrator",
    "orchestrator",
    "TriageAgent",
    "IntakeAgent",
    "intake_agent",
    "MockLLMProvider",
    "OpenAIProvider",
    "AnthropicProvider",
    "get_llm_provider",
    "ModelConfig",
    "MultiModelAssessmentConfig",
    "get_default_model_configs",
    "get_default_multi_model_config",
    "BaseProviderAdapter",
    "MockProviderAdapter",
    "get_provider_adapter",
    "register_provider_adapter",
    "MultiLLMMedicalAssessor",
    "medical_assessor",
    "assess_patient_case",
]
