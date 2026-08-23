"""Unit Tests for HealthAssist Safety and Severity Engine.

Tests:
1. Deterministic evaluation independent of LLM consensus.
2. Severity categorization (LOW, MODERATE, HIGH, EMERGENCY).
3. Red-flag condition detection grounded in authoritative clinical guidelines.
4. Isolated rule configuration and custom rule injection.
5. Clinical negation filtering (preventing false alarms on 'no chest pain').
6. Safety override enforcement over LLM consensus.
7. Verification that no medication dosages or prescriptions are output.
"""

import pytest
from typing import Dict, Any

from backend.app.schemas.intake import PatientCase
from backend.app.safety.safety_engine import SafetyEngine, safety_engine, SafetyEvaluationResult
from backend.app.safety.rules import (
    SafetyRule,
    MASTER_SAFETY_RULES,
    CARDIOVASCULAR_EMERGENCY_RULES,
    RESPIRATORY_EMERGENCY_RULES,
    NEUROLOGICAL_EMERGENCY_RULES,
    SURGICAL_TRAUMA_PSYCH_RULES,
    URGENT_HIGH_SEVERITY_RULES,
)


class TestSafetyRulesConfiguration:
    """Validates the isolation and clinical integrity of the rule definitions."""

    def test_master_rules_structure_and_guidelines(self):
        assert len(MASTER_SAFETY_RULES) >= 10
        for rule in MASTER_SAFETY_RULES:
            assert isinstance(rule, SafetyRule)
            assert rule.rule_id
            assert rule.name
            assert rule.category in ["Cardiovascular", "Respiratory", "Neurological", "Trauma/Surgical", "Psychiatric", "Infectious/Systemic", "Gastrointestinal", "Gastrointestinal/Surgical"]
            assert rule.target_severity in ["EMERGENCY", "HIGH"]
            assert len(rule.keywords) > 0
            assert rule.clinical_guideline, f"Rule {rule.rule_id} must have authoritative clinical guideline reference"
            assert rule.action_directive, f"Rule {rule.rule_id} must have clear non-prescriptive action directive"

    def test_custom_rule_set_injection(self):
        custom_rule = SafetyRule(
            rule_id="CUSTOM-001",
            name="Custom Severe Toxin Exposure",
            category="Toxicology",
            target_severity="EMERGENCY",
            keywords=["ingested pesticide", "cyanide exposure"],
            description="Acute toxic ingestion requiring immediate poison control / antidote.",
            clinical_guideline="AAPCC / ACMT Guidelines",
            action_directive="Immediate emergency decontamination and poison control notification.",
            requires_safety_override=True,
        )
        custom_engine = SafetyEngine(rules=[custom_rule])
        
        case = PatientCase(
            main_complaint="Accidental ingested pesticide exposure",
            symptoms=["nausea", "dizziness"],
        )
        res = custom_engine.evaluate(case)
        assert res["severity"] == "EMERGENCY"
        assert res["safety_override"] is True
        assert any("Custom Severe Toxin Exposure" in rf for rf in res["red_flags_detected"])


class TestEmergencyRedFlagDetection:
    """Validates EMERGENCY severity detection and safety override triggers."""

    def test_cardiovascular_emergency_crushing_chest_pain(self):
        case = PatientCase(
            main_complaint="Severe crushing chest pain radiating to left arm",
            symptoms=["chest pressure", "pain radiating to jaw", "diaphoresis"],
            severity=9,
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "EMERGENCY"
        assert res["safety_override"] is True
        assert len(res["red_flags_detected"]) >= 1
        assert any("Acute Coronary Syndrome" in rf for rf in res["red_flags_detected"])
        assert "911" in res["recommended_action"] or "Emergency Department" in res["recommended_action"]

    def test_neurological_emergency_stroke_fast_protocol(self):
        case = PatientCase(
            main_complaint="Sudden weakness on right side and slurred speech",
            symptoms=["facial droop", "arm weakness", "slurred speech"],
            onset="sudden within 30 minutes",
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "EMERGENCY"
        assert res["safety_override"] is True
        assert any("Stroke" in rf for rf in res["red_flags_detected"])

    def test_neurological_emergency_thunderclap_headache(self):
        case = PatientCase(
            main_complaint="Worst headache of my life peaking in 10 seconds",
            symptoms=["thunderclap headache", "photophobia", "nausea"],
            severity=10,
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "EMERGENCY"
        assert res["safety_override"] is True
        assert any("Thunderclap" in rf for rf in res["red_flags_detected"])

    def test_respiratory_emergency_severe_dyspnea_and_anaphylaxis(self):
        case = PatientCase(
            main_complaint="Allergic reaction with throat closing and stridor",
            symptoms=["throat swelling", "unable to breathe", "severe shortness of breath"],
            red_flags=["throat closing"],
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "EMERGENCY"
        assert res["safety_override"] is True
        assert any("Airway Compromise" in rf or "Respiratory Distress" in rf for rf in res["red_flags_detected"])

    def test_psychiatric_crisis_and_uncontrolled_hemorrhage(self):
        case_psych = PatientCase(
            main_complaint="Feeling overwhelmed with thoughts of hurting myself",
            symptoms=["depression", "suicidal thoughts"],
        )
        res_psych = safety_engine.evaluate(case_psych)
        assert res_psych["severity"] == "EMERGENCY"
        assert res_psych["safety_override"] is True

        case_bleed = PatientCase(
            main_complaint="Deep laceration with severe uncontrolled bleeding",
            symptoms=["uncontrolled bleeding", "dizziness"],
        )
        res_bleed = safety_engine.evaluate(case_bleed)
        assert res_bleed["severity"] == "EMERGENCY"
        assert res_bleed["safety_override"] is True


class TestUrgentHighSeverityDetection:
    """Validates HIGH severity categorization for urgent medical conditions."""

    def test_high_fever_above_102(self):
        case = PatientCase(
            main_complaint="Persistent fever above 102 with chills",
            symptoms=["high fever", "body aches", "fatigue"],
            severity=7,
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "HIGH"
        assert res["safety_override"] is False
        assert any("High Fever" in rf for rf in res["red_flags_detected"])
        assert "12 to 24 hours" in res["recommended_action"] or "Urgent" in res["recommended_action"]

    def test_gastrointestinal_bleeding_melena(self):
        case = PatientCase(
            main_complaint="Noticed black tarry stool for 2 days",
            symptoms=["black tarry stool", "mild abdominal cramping"],
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "HIGH"
        assert any("Gastrointestinal Bleeding" in rf for rf in res["red_flags_detected"])

    def test_intractable_vomiting_and_severe_pain_scale(self):
        case = PatientCase(
            main_complaint="Gastroenteritis cannot keep fluids down for 24h",
            symptoms=["nausea", "vomiting", "cannot keep fluids down"],
            severity=8,
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "HIGH"


class TestModerateAndLowSeverity:
    """Validates MODERATE and LOW categories for routine and self-limiting symptoms."""

    def test_moderate_severity_routine_clinical_inquiry(self):
        case = PatientCase(
            main_complaint="Dry cough and runny nose for 4 days",
            symptoms=["dry cough", "runny nose", "mild throat tickle"],
            severity=5,
            duration="4 days",
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "MODERATE"
        assert res["safety_override"] is False
        assert len(res["red_flags_detected"]) == 0

    def test_low_severity_mild_self_limiting_symptom(self):
        case = PatientCase(
            main_complaint="Slight muscle soreness in calf",
            symptoms=["muscle soreness"],
            severity=2,
            duration="1 day",
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] == "LOW"
        assert res["safety_override"] is False
        assert len(res["red_flags_detected"]) == 0
        assert "Self-care" in res["recommended_action"] or "mild" in res["recommended_action"].lower()


class TestClinicalNegationHandling:
    """Ensures clinical negation (e.g. 'no chest pain') does NOT trigger false alarms."""

    def test_negated_chest_pain_and_dyspnea(self):
        case = PatientCase(
            main_complaint="Mild tension headache after screen time",
            symptoms=["headache", "denies chest pain", "no shortness of breath", "no facial droop"],
            severity=3,
        )
        res = safety_engine.evaluate(case)
        # Must not falsely flag as emergency!
        assert res["severity"] != "EMERGENCY"
        assert res["safety_override"] is False
        assert len(res["red_flags_detected"]) == 0

    def test_negated_fever_and_meningitis_signs(self):
        case = PatientCase(
            main_complaint="Neck muscle strain from sleeping awkwardly, negative for stiff neck and fever",
            symptoms=["neck soreness", "without high fever"],
            severity=4,
        )
        res = safety_engine.evaluate(case)
        assert res["severity"] != "EMERGENCY"
        assert res["safety_override"] is False


class TestSafetyOverridePriorityOverLLMConsensus:
    """Validates that safety engine override strictly supersedes LLM model consensus."""

    def test_safety_override_enforced_over_low_risk_llm(self):
        # Simulated LLM consensus says LOW risk / Tension Headache
        llm_severity = "LOW"
        llm_score = 95.0

        # But patient reported a thunderclap headache red flag
        case = PatientCase(
            main_complaint="Sudden thunderclap headache peaking in seconds",
            symptoms=["worst headache of my life"],
            severity=10,
        )
        safety_eval = safety_engine.evaluate(case)
        assert safety_eval["safety_override"] is True

        # Apply override enforcement
        enforced = safety_engine.enforce_safety_override(
            llm_consensus_severity=llm_severity,
            llm_consensus_score=llm_score,
            safety_evaluation=safety_eval,
        )

        assert enforced["effective_severity"] == "EMERGENCY"
        assert enforced["safety_override_applied"] is True
        assert "Safety Engine override enforced" in enforced["clinical_rationale"]
        assert len(enforced["red_flags"]) > 0

    def test_no_prescriptions_or_drug_dosages(self):
        """Verifies engine outputs non-prescriptive triage guidance without drug dosages."""
        test_cases = [
            PatientCase(main_complaint="Severe crushing chest pain", symptoms=["chest pain"]),
            PatientCase(main_complaint="High fever above 102", symptoms=["high fever"]),
            PatientCase(main_complaint="Mild common cold", symptoms=["runny nose"]),
        ]
        forbidden_dosage_patterns = ["mg", "tablet", "capsule", "prescription", "take 500", "take 200", "amoxicillin", "penicillin"]

        for c in test_cases:
            res = safety_engine.evaluate(c)
            action = res["recommended_action"].lower()
            for forb in forbidden_dosage_patterns:
                assert forb not in action, f"Safety Engine action should not contain prescription/dosage '{forb}'"
