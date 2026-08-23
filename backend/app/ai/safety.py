"""Independent Deterministic Safety Engine for HealthAssist AI.

Proxies to the centralized HealthAssist Safety and Severity Engine
(backend.app.safety.safety_engine) while providing SafetyOutput pydantic
compatibility for the AI orchestration pipeline.
"""

from typing import List, Dict, Any, Optional
from backend.app.ai.schemas import PatientCase, SafetyOutput
from backend.app.safety.safety_engine import (
    SafetyEngine as CoreSafetyEngine,
    SafetyEvaluationResult,
    safety_engine as core_safety_engine,
)
from backend.app.safety.rules import (
    SafetyRule,
    MASTER_SAFETY_RULES,
)
from backend.app.utils.logger import logger


class SafetyEngine:
    """Deterministic clinical safety engine wrapper."""

    def __init__(self, core_engine: Optional[CoreSafetyEngine] = None):
        self.core = core_engine or core_safety_engine

    def evaluate(self, patient_case: PatientCase) -> SafetyOutput:
        """Evaluates patient case using the independent rule-based Safety Engine."""
        res: Dict[str, Any] = self.core.evaluate(patient_case)

        return SafetyOutput(
            severity=res["severity"],
            red_flags=res.get("red_flags_detected", []),
            safety_override=res["safety_override"],
            recommended_action=res["recommended_action"],
        )


# Global singleton
safety_engine = SafetyEngine()

__all__ = ["SafetyEngine", "safety_engine", "SafetyRule", "MASTER_SAFETY_RULES"]
