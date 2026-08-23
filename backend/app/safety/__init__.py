"""Safety module exports for HealthAssist."""

from backend.app.safety.safety_engine import (
    SafetyEngine,
    SafetyEvaluationResult,
    safety_engine,
)
from backend.app.safety.rules import (
    SafetyRule,
    MASTER_SAFETY_RULES,
    CARDIOVASCULAR_EMERGENCY_RULES,
    RESPIRATORY_EMERGENCY_RULES,
    NEUROLOGICAL_EMERGENCY_RULES,
    SURGICAL_TRAUMA_PSYCH_RULES,
    URGENT_HIGH_SEVERITY_RULES,
)
from backend.app.safety.safety_guard import SafetyGuard

__all__ = [
    "SafetyEngine",
    "SafetyEvaluationResult",
    "safety_engine",
    "SafetyRule",
    "MASTER_SAFETY_RULES",
    "CARDIOVASCULAR_EMERGENCY_RULES",
    "RESPIRATORY_EMERGENCY_RULES",
    "NEUROLOGICAL_EMERGENCY_RULES",
    "SURGICAL_TRAUMA_PSYCH_RULES",
    "URGENT_HIGH_SEVERITY_RULES",
    "SafetyGuard",
]
