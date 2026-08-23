"""HealthAssist Safety and Severity Engine.

Deterministic, auditable clinical safety engine operating strictly independent
of LLM model consensus. Evaluates normalized PatientCase structures against
authoritative clinical red-flag rules.

Severity Categories:
- EMERGENCY (Immediate Emergency Department / 911 evaluation required)
- HIGH      (Urgent medical consultation needed within 12-24 hours)
- MODERATE  (Routine clinical telehealth consultation recommended)
- LOW       (Self-care guidance, supportive hydration/rest, and monitoring)

STRICT SAFETY OVERRIDE PRIORITY:
Safety rules unconditionally supersede LLM model consensus.
"""

import re
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

from backend.app.schemas.intake import PatientCase
from backend.app.safety.rules import (
    SafetyRule,
    MASTER_SAFETY_RULES,
    NEGATION_PATTERNS,
)
from backend.app.utils.logger import logger


class SafetyEvaluationResult(BaseModel):
    """Structured response model for Safety Engine evaluations."""
    severity: str = Field(
        ...,
        description="Clinical severity category: 'LOW', 'MODERATE', 'HIGH', or 'EMERGENCY'."
    )
    red_flags_detected: List[str] = Field(
        default_factory=list,
        description="List of specific clinical red-flag condition descriptions detected."
    )
    safety_override: bool = Field(
        default=False,
        description="True if detected emergency red flags unconditionally supersede LLM consensus."
    )
    recommended_action: str = Field(
        ...,
        description="Authoritative clinical action directive (non-prescriptive triage advice)."
    )

    def to_dict(self) -> Dict[str, Any]:
        """Returns standard dictionary payload conforming to API specifications."""
        return {
            "severity": self.severity,
            "red_flags_detected": self.red_flags_detected,
            "safety_override": self.safety_override,
            "recommended_action": self.recommended_action,
        }


class SafetyEngine:
    """Independent rule-based clinical safety and triage engine."""

    def __init__(self, rules: Optional[List[SafetyRule]] = None):
        """Initializes the engine with an auditable rule set (defaults to MASTER_SAFETY_RULES)."""
        self.rules: List[SafetyRule] = rules if rules is not None else list(MASTER_SAFETY_RULES)
        self.negation_patterns: List[str] = list(NEGATION_PATTERNS)

    def is_negated(self, text: str, keyword: str) -> bool:
        """Checks if a symptom keyword is preceded by clinical negation (e.g. 'no chest pain')."""
        text_lower = text.lower()
        keyword_lower = keyword.lower()

        for neg in self.negation_patterns:
            # Pattern: negation prefix within 3-4 words before the keyword
            neg_regex = rf"{neg}(?:\w+\s+){{0,3}}{re.escape(keyword_lower)}\b"
            if re.search(neg_regex, text_lower):
                return True
        return False

    def normalize_case_text(self, patient_case: Union[PatientCase, Dict[str, Any]]) -> str:
        """Extracts and normalizes all textual clinical fields from the patient case."""
        if isinstance(patient_case, dict):
            main_comp = patient_case.get("main_complaint") or ""
            syms = patient_case.get("symptoms") or []
            assoc = patient_case.get("associated_symptoms") or []
            flags = patient_case.get("red_flags") or []
            onset = patient_case.get("onset") or ""
        else:
            main_comp = patient_case.main_complaint or ""
            syms = patient_case.symptoms or []
            assoc = patient_case.associated_symptoms or []
            flags = patient_case.red_flags or []
            onset = str(patient_case.onset or "")

        parts = [main_comp] + syms + assoc + flags + [onset]
        return " ".join([str(p).strip() for p in parts if p]).lower()

    def evaluate(self, patient_case: Union[PatientCase, Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluates a structured PatientCase independently of any LLM consensus.
        
        Returns:
            {
                "severity": "EMERGENCY" | "HIGH" | "MODERATE" | "LOW",
                "red_flags_detected": List[str],
                "safety_override": bool,
                "recommended_action": str
            }
        """
        all_text = self.normalize_case_text(patient_case)

        # Extract pain scale or numerical severity if present
        if isinstance(patient_case, dict):
            raw_sev = patient_case.get("severity")
            explicit_flags = patient_case.get("red_flags") or []
        else:
            raw_sev = patient_case.severity
            explicit_flags = patient_case.red_flags or []

        try:
            numeric_sev = int(raw_sev) if raw_sev is not None else 0
        except (ValueError, TypeError):
            numeric_sev = 0

        emergency_flags: List[str] = []
        urgent_flags: List[str] = []

        # 1. Rule-based evaluation against isolated rule set
        for rule in self.rules:
            for kw in rule.keywords:
                # Check for exact word boundary match
                if re.search(rf"\b{re.escape(kw.lower())}\b", all_text):
                    # Filter out negated mentions (e.g. "no shortness of breath")
                    if not self.is_negated(all_text, kw):
                        flag_label = f"{rule.name} ({rule.description})"
                        if rule.target_severity == "EMERGENCY":
                            if flag_label not in emergency_flags:
                                emergency_flags.append(flag_label)
                        elif rule.target_severity == "HIGH":
                            if flag_label not in urgent_flags:
                                urgent_flags.append(flag_label)
                        break

        # 2. Check explicit patient case red-flags
        for ef in explicit_flags:
            if ef and isinstance(ef, str):
                ef_clean = ef.strip()
                if not self.is_negated(all_text, ef_clean):
                    ef_lower = ef_clean.lower()
                    if any(k in ef_lower for k in ["chest", "breath", "stroke", "bleed", "unconscious", "anaphylaxis", "stiff neck"]):
                        if ef_clean not in emergency_flags:
                            emergency_flags.append(ef_clean)
                    else:
                        if ef_clean not in urgent_flags:
                            urgent_flags.append(ef_clean)

        # 3. Emergency Severity Index (ESI) Triaging Rules
        if emergency_flags or (numeric_sev >= 9 and any(k in all_text for k in ["chest", "head", "abdomen", "breath"])):
            severity = "EMERGENCY"
            safety_override = True
            recommended_action = (
                "CRITICAL EMERGENCY ALERT: Red-flag symptoms identified indicating potential acute life/organ threat. "
                "Seek immediate emergency medical evaluation (call 911 or proceed immediately to the nearest Emergency Department). "
                "Do not drive yourself."
            )
            detected_red_flags = emergency_flags + urgent_flags

        elif urgent_flags or numeric_sev >= 8:
            severity = "HIGH"
            safety_override = False
            recommended_action = (
                "URGENT MEDICAL ATTENTION: Symptoms indicate significant acute discomfort or potential clinical complication. "
                "Consult an urgent care physician or licensed medical professional within 12 to 24 hours."
            )
            detected_red_flags = urgent_flags

        elif numeric_sev >= 5 or len(all_text.split()) > 15:
            severity = "MODERATE"
            safety_override = False
            recommended_action = (
                "ROUTINE CLINICAL EVALUATION: Symptoms are currently stable but warrant a scheduled telemedicine or "
                "in-person primary care consultation if symptoms persist or worsen over 48 to 72 hours."
            )
            detected_red_flags = []

        else:
            severity = "LOW"
            safety_override = False
            recommended_action = (
                "SUPPORTIVE SELF-CARE & MONITORING: Symptoms appear mild and non-urgent. "
                "Maintain adequate fluid hydration, rest, and monitor symptoms. Seek medical advice if condition changes."
            )
            detected_red_flags = []

        result = SafetyEvaluationResult(
            severity=severity,
            red_flags_detected=detected_red_flags,
            safety_override=safety_override,
            recommended_action=recommended_action,
        )

        logger.info(
            f"SafetyEngine evaluation: severity={result.severity}, override={result.safety_override}, red_flags={len(result.red_flags_detected)}"
        )
        return result.to_dict()

    def enforce_safety_override(
        self,
        llm_consensus_severity: str,
        llm_consensus_score: float,
        safety_evaluation: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Enforces that safety engine evaluation unconditionally overrides LLM consensus when red flags are present."""
        if safety_evaluation.get("safety_override", False):
            return {
                "effective_severity": safety_evaluation["severity"],
                "safety_override_applied": True,
                "final_recommended_action": safety_evaluation["recommended_action"],
                "clinical_rationale": "Safety Engine override enforced due to acute emergency red flags.",
                "red_flags": safety_evaluation.get("red_flags_detected", []),
            }

        return {
            "effective_severity": llm_consensus_severity or safety_evaluation["severity"],
            "safety_override_applied": False,
            "final_recommended_action": safety_evaluation["recommended_action"],
            "clinical_rationale": "LLM consensus aligned within safe clinical boundaries.",
            "red_flags": safety_evaluation.get("red_flags_detected", []),
        }


# Global singleton instance
safety_engine = SafetyEngine()
