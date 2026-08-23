"""Independent Deterministic Safety Engine for HealthAssist.

Evaluates PatientCase records against clinical triage and emergency screening rules.
HAS STRICT PRIORITY OVER LLM JUDGE AND MODEL VOTES.
"""

import re
from typing import List, Dict, Any, Optional
from backend.app.ai.schemas import PatientCase, SafetyOutput
from backend.app.utils.logger import logger


# Emergency Red Flag Symptom Clusters
EMERGENCY_RED_FLAGS = [
    # Cardiovascular & Pulmonary
    ("severe chest pain", "Severe crushing chest pain or tightness"),
    ("chest pressure", "Retrosternal chest pressure with radiating pain"),
    ("shortness of breath", "Acute severe respiratory distress or dyspnea"),
    ("difficulty breathing", "Severe respiratory difficulty"),
    ("coughing blood", "Hemoptysis (coughing up blood)"),
    ("stridor", "Acute inspiratory stridor or upper airway compromise"),
    ("throat closing", "Anaphylactic airway constriction"),
    ("anaphylaxis", "Systemic anaphylactic reaction"),

    # Neurological / Cerebrovascular
    ("sudden numbness", "Sudden unilateral neurological weakness or numbness"),
    ("facial droop", "Facial droop / acute stroke signs"),
    ("slurred speech", "Acute dysarthria / speech impairment"),
    ("worst headache of my life", "Sudden thunderclap headache"),
    ("thunderclap headache", "Sudden onset thunderclap headache"),
    ("loss of consciousness", "Syncope or loss of consciousness"),
    ("unconscious", "Unresponsiveness / syncope"),
    ("stiff neck and fever", "Meningismus (nuchal rigidity with fever)"),
    ("neck stiffness and fever", "Meningismus with systemic fever"),

    # Psychiatric / Toxicity / Trauma
    ("suicidal", "Acute psychiatric crisis / suicidal ideation"),
    ("severe bleeding", "Uncontrolled active hemorrhage"),
]

# Urgent (High Severity) Indicators
URGENT_INDICATORS = [
    ("high fever", "High fever (> 102°F / 39°C)"),
    ("fever above 102", "High fever (> 102°F / 39°C)"),
    ("fever > 102", "High fever (> 102°F / 39°C)"),
    ("cannot keep fluids down", "Severe intractable vomiting / dehydration"),
    ("persistent vomiting", "Persistent severe vomiting"),
    ("blood in stool", "Gastrointestinal bleeding"),
    ("black tarry stool", "Melena (upper GI bleeding)"),
    ("severe abdominal pain", "Acute severe abdominal pain"),
]


class SafetyEngine:
    """Deterministic, auditable clinical safety engine."""

    def evaluate(self, patient_case: PatientCase) -> SafetyOutput:
        """Evaluates patient case and determines if safety override is required."""
        all_text = " ".join([
            patient_case.main_complaint or "",
            " ".join(patient_case.symptoms or []),
            " ".join(patient_case.associated_symptoms or []),
            " ".join(patient_case.red_flags or []),
            str(patient_case.onset or ""),
        ]).lower()

        detected_emergency_flags: List[str] = []
        detected_urgent_flags: List[str] = []

        # 1. Screen for Emergency Red Flags
        for keyword, label in EMERGENCY_RED_FLAGS:
            if re.search(rf"\b{re.escape(keyword)}\b", all_text):
                if label not in detected_emergency_flags:
                    detected_emergency_flags.append(label)

        # 2. Screen for Urgent Flags
        for keyword, label in URGENT_INDICATORS:
            if re.search(rf"\b{re.escape(keyword)}\b", all_text):
                if label not in detected_urgent_flags:
                    detected_urgent_flags.append(label)

        # Also incorporate any explicit red flags in patient_case.red_flags
        for rf in patient_case.red_flags:
            if rf and rf not in detected_emergency_flags and rf not in detected_urgent_flags:
                rf_lower = rf.lower()
                if any(k in rf_lower for k in ["chest", "breath", "stroke", "bleed", "unconscious", "anaphylaxis"]):
                    detected_emergency_flags.append(rf)
                else:
                    detected_urgent_flags.append(rf)

        # 3. Numeric severity score check (e.g. Pain 9-10/10)
        try:
            numeric_sev = int(patient_case.severity) if patient_case.severity is not None else 0
        except (ValueError, TypeError):
            numeric_sev = 0

        # Determine Severity and Safety Override
        if detected_emergency_flags or (numeric_sev >= 9 and any(k in all_text for k in ["chest", "head", "abdomen", "breath"])):
            severity = "EMERGENCY"
            safety_override = True
            recommended_action = (
                "EMERGENCY WARNING: Reported red-flag symptoms require immediate emergency clinical evaluation. "
                "Please call 911 or proceed immediately to the nearest Emergency Department."
            )
            all_flags = detected_emergency_flags + detected_urgent_flags

        elif detected_urgent_flags or numeric_sev >= 8:
            severity = "HIGH"
            safety_override = False
            recommended_action = (
                "URGENT CARE: Symptoms indicate high clinical discomfort or potential urgent complication. "
                "Consult an urgent care physician or telehealth specialist within 12 to 24 hours."
            )
            all_flags = detected_urgent_flags

        elif numeric_sev >= 5 or len(patient_case.symptoms) >= 3:
            severity = "MODERATE"
            safety_override = False
            recommended_action = (
                "ROUTINE EVALUATION: Symptoms are stable but warrant timely clinical consultation "
                "if persisting beyond 48 to 72 hours."
            )
            all_flags = []

        else:
            severity = "LOW"
            safety_override = False
            recommended_action = (
                "SELF-CARE & MONITORING: Symptoms appear mild. Rest, maintain hydration, and monitor for changes."
            )
            all_flags = []

        logger.info(
            f"Safety evaluation complete: severity={severity}, override={safety_override}, flags={len(all_flags)}"
        )

        return SafetyOutput(
            severity=severity,
            red_flags=all_flags,
            safety_override=safety_override,
            recommended_action=recommended_action,
        )


# Global singleton safety engine
safety_engine = SafetyEngine()
