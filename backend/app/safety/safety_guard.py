"""Safety Assessment & Clinical Red-Flag Guard for HealthAssist."""

from typing import Dict, Any, List, Optional
from backend.app.ai.safety import SafetyEngine, safety_engine
from backend.app.ai.schemas import PatientCase, SafetyOutput


class SafetyGuard:
    """Clinical safety validation guard."""

    def __init__(self, emergency_keywords: Optional[List[str]] = None):
        self.engine = safety_engine

    def check_for_red_flags(self, text: str) -> Dict[str, Any]:
        """Perform safety screening on text input."""
        temp_case = PatientCase(
            main_complaint=text,
            symptoms=[text],
        )
        safety_res: SafetyOutput = self.engine.evaluate(temp_case)
        return {
            "is_emergency": safety_res.safety_override,
            "flagged_keywords": safety_res.red_flags,
            "action_required": "EMERGENCY_CALL_911" if safety_res.safety_override else "CONTINUE_STANDARD_ASSESSMENT",
            "severity": safety_res.severity,
            "recommended_action": safety_res.recommended_action,
        }

    def evaluate_case(self, patient_case: PatientCase) -> SafetyOutput:
        """Evaluates structured patient case."""
        return self.engine.evaluate(patient_case)


__all__ = ["SafetyGuard", "SafetyEngine", "safety_engine"]
