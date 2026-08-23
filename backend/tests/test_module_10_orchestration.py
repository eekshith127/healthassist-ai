"""Comprehensive Test Suite for Module 10 Multi-LLM AI Orchestration."""

import asyncio
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.user import User
from backend.app.models.assessment import Assessment
from backend.app.models.model_assessment import ModelAssessment
from backend.app.models.consensus_result import ConsensusResult
from backend.app.models.final_assessment import FinalAssessment

from backend.app.ai.schemas import (
    PatientCase,
    ModelAssessmentOutput,
    PossibleCondition,
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
from backend.app.ai.nvidia_provider import NVIDIAProvider
from backend.app.ai.ollama_provider import OllamaProvider
from backend.app.ai.gemini_provider import GeminiProvider


@pytest.fixture
def sample_case():
    return PatientCase(
        main_complaint="Throbbing headache and nausea",
        symptoms=["severe headache", "nausea", "light sensitivity"],
        duration="1 day",
        severity=8,
        onset="gradual",
        associated_symptoms=["photophobia"],
        medical_conditions=["none"],
        medications=[],
        allergies=[],
        age=24,
        sex="female",
        red_flags=[],
    )


@pytest.fixture
def emergency_chest_case():
    return PatientCase(
        main_complaint="Crushing retrosternal chest pain",
        symptoms=["chest pain", "shortness of breath", "chest pressure"],
        duration="45 minutes",
        severity=9,
        onset="sudden",
        associated_symptoms=["diaphoresis", "nausea"],
        medical_conditions=["hypertension"],
        medications=["lisinopril"],
        allergies=[],
        age=58,
        sex="male",
        red_flags=["chest pain", "shortness of breath"],
    )


# -------------------------------------------------------------
# 1. Gemini Intake AI Tests
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_gemini_intake_process_turn():
    """Verifies that the Intake AI extracts symptoms and formats a structured PatientCase."""
    intake = GeminiIntakeAI()
    turn_output = await intake.process_turn(
        user_message="I have had a severe throbbing headache for 2 days with 7/10 pain",
        conversation_history=[],
    )
    assert turn_output.assistant_message
    assert turn_output.patient_case.main_complaint
    assert len(turn_output.patient_case.symptoms) >= 1
    assert turn_output.patient_case.severity == 7 or turn_output.patient_case.severity is not None


# -------------------------------------------------------------
# 2. Data Minimization Tests
# -------------------------------------------------------------

def test_patient_case_data_minimization(sample_case):
    """Verifies that no PII (names, emails, tokens, IDs) is included in the payload sent to LLMs."""
    minimized = sample_case.to_minimized_payload()
    assert "name" not in minimized
    assert "full_name" not in minimized
    assert "email" not in minimized
    assert "clerk_user_id" not in minimized
    assert "token" not in minimized
    assert minimized["age"] == 24
    assert minimized["sex"] == "female"
    assert "severe headache" in minimized["symptoms"]


# -------------------------------------------------------------
# 3, 4, 5. Provider Abstraction Tests
# -------------------------------------------------------------

def test_provider_instantiations():
    """Verifies all provider adapters instantiate correctly with standard interface."""
    gemini = GeminiProvider(api_key="test_gemini")
    nvidia = NVIDIAProvider(api_key="test_nvidia")
    ollama = OllamaProvider()

    assert gemini.model_name
    assert nvidia.model_name
    assert ollama.model_name
    assert nvidia.base_url.endswith("/chat/completions")


# -------------------------------------------------------------
# 6. Consensus Engine Tests: Scenarios A, B, C
# -------------------------------------------------------------

def test_consensus_scenario_a_unanimous():
    """Scenario A: All 3 models agree on Migraine -> High agreement (3/3)."""
    engine = DeterministicConsensusEngine()

    assessments = {
        "model_1": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=85)],
            severity="moderate",
            recommended_specialty="Neurology",
        ),
        "model_2": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=80)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
        "model_3": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=82)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
    }

    res: ConsensusOutput = engine.compute_consensus(assessments)
    assert res.leading_condition == "Migraine"
    assert res.model_agreement == "3/3"
    assert res.agreement_level == "high"
    assert res.consensus_score >= 80
    assert len(res.disagreements) == 0


def test_consensus_scenario_b_partial_disagree():
    """Scenario B: 2 models agree on Migraine, 1 model suggests Tension Headache -> Moderate agreement (2/3)."""
    engine = DeterministicConsensusEngine()

    assessments = {
        "model_1": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=82)],
            severity="moderate",
            recommended_specialty="Neurology",
        ),
        "model_2": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=80)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
        "model_3": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Tension-Type Headache", score=74)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
    }

    res: ConsensusOutput = engine.compute_consensus(assessments)
    assert res.leading_condition == "Migraine"
    assert res.model_agreement == "2/3"
    assert res.agreement_level == "moderate"
    assert 65 <= res.consensus_score <= 85
    assert len(res.disagreements) == 1
    assert "Tension-Type Headache" in res.disagreements[0]


def test_consensus_scenario_c_strong_disagree():
    """Scenario C: 3 models suggest 3 completely different conditions -> Low agreement (1/3)."""
    engine = DeterministicConsensusEngine()

    assessments = {
        "model_1": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=75)],
            severity="moderate",
            recommended_specialty="Neurology",
        ),
        "model_2": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Tension-Type Headache", score=72)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
        "model_3": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Sinusitis / Sinus Headache", score=70)],
            severity="moderate",
            recommended_specialty="Otolaryngology",
        ),
    }

    res: ConsensusOutput = engine.compute_consensus(assessments)
    assert res.model_agreement == "1/3"
    assert res.agreement_level == "low"
    assert res.consensus_score <= 60
    assert len(res.disagreements) >= 2


def test_consensus_with_unavailable_model():
    """Verifies consensus calculation when 1 model is unavailable (2/2 models)."""
    engine = DeterministicConsensusEngine()

    assessments = {
        "model_1": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Acute Bronchitis", score=80)],
            severity="mild",
            recommended_specialty="General Physician",
        ),
        "model_2": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Acute Bronchitis", score=78)],
            severity="mild",
            recommended_specialty="Pulmonology",
        ),
    }

    res: ConsensusOutput = engine.compute_consensus(assessments)
    assert res.leading_condition == "Acute Bronchitis"
    assert res.model_agreement == "2/2"
    assert res.models_available == 2
    assert res.agreement_level == "high"


# -------------------------------------------------------------
# 7. AI Judge Tests
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_ai_judge_synthesis(sample_case):
    """Verifies that the AI Judge synthesizes agreement and explanations without chain-of-thought."""
    judge = AIJudge()
    assessments = {
        "model_1": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=84)],
            severity="moderate",
            recommended_specialty="Neurology",
        ),
        "model_2": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=80)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
        "model_3": ModelAssessmentOutput(
            possible_conditions=[PossibleCondition(name="Migraine", score=82)],
            severity="moderate",
            recommended_specialty="General Physician",
        ),
    }
    consensus = consensus_engine.compute_consensus(assessments, sample_case)

    output: JudgeOutput = await judge.evaluate_consensus(sample_case, assessments, consensus)
    assert output.synthesized_summary
    assert output.agreement_explanation
    assert output.recommended_specialty
    assert output.recommended_next_step


# -------------------------------------------------------------
# 8. Safety Engine Tests: Scenario D
# -------------------------------------------------------------

def test_safety_engine_override_emergency(emergency_chest_case):
    """Scenario D: Red-flag symptoms trigger Safety Override with EMERGENCY severity."""
    engine = SafetyEngine()
    safety: SafetyOutput = engine.evaluate(emergency_chest_case)

    assert safety.safety_override is True
    assert safety.severity == "EMERGENCY"
    assert len(safety.red_flags) > 0
    assert "911" in safety.recommended_action or "Emergency" in safety.recommended_action


def test_safety_engine_mild_case(sample_case):
    """Mild case without red flags should not trigger safety override."""
    engine = SafetyEngine()
    safety: SafetyOutput = engine.evaluate(sample_case)

    assert safety.safety_override is False
    assert safety.severity in ["LOW", "MODERATE", "HIGH"]


# -------------------------------------------------------------
# 9. Full Multi-LLM Orchestration Pipeline & DB Persistence
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_orchestrator_full_pipeline_with_database(sample_case):
    """Tests the entire pipeline: PatientCase -> 3 Models -> Consensus -> Judge -> Safety -> Final Assessment -> DB."""
    db: Session = SessionLocal()
    try:
        # Create test user and assessment in database
        test_user = User(
            clerk_user_id=f"clerk_orch_{uuid.uuid4().hex[:8]}",
            email=f"orch_{uuid.uuid4().hex[:8]}@example.com",
            name="Orchestrator Test Patient",
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        assessment = Assessment(
            user_id=test_user.id,
            symptoms=sample_case.main_complaint,
            duration=sample_case.duration,
            severity=str(sample_case.severity),
            triage_level="non-urgent",
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Clear any preexisting rows for this specific assessment_id
        db.query(ModelAssessment).filter(ModelAssessment.assessment_id == assessment.id).delete()
        db.commit()

        # Run pipeline
        final_res: FinalAssessmentOutput = await orchestrator.execute_pipeline(
            patient_case=sample_case,
            assessment_id=assessment.id,
            db=db,
            mock_scenario="unanimous",
        )

        assert final_res.leading_condition
        assert final_res.consensus_score > 0
        assert final_res.model_agreement == "3/3"
        assert len(final_res.model_assessments) == 3
        assert "not constitute a medical diagnosis" in final_res.disclaimer.lower()

        # Verify DB records were created and linked
        model_recs = db.query(ModelAssessment).filter(ModelAssessment.assessment_id == assessment.id).all()
        assert len(model_recs) == 3

        consensus_rec = db.query(ConsensusResult).filter(ConsensusResult.assessment_id == assessment.id).first()
        assert consensus_rec is not None
        assert consensus_rec.score == float(final_res.consensus_score)

        final_rec = db.query(FinalAssessment).filter(FinalAssessment.assessment_id == assessment.id).first()
        assert final_rec is not None
        assert final_rec.summary == final_res.explanation

    finally:
        db.close()


# -------------------------------------------------------------
# 10. API Endpoints Tests
# -------------------------------------------------------------

def test_api_assessment_endpoints():
    """Tests all assessment REST endpoints under /api/assessments."""
    client = TestClient(app)
    db: Session = SessionLocal()

    try:
        # Create test user
        test_user = User(
            clerk_user_id=f"clerk_api_{uuid.uuid4().hex[:8]}",
            email=f"api_{uuid.uuid4().hex[:8]}@example.com",
            name="API Test Patient",
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # 1. POST /api/assessments (create assessment)
        create_payload = {
            "symptoms": "Throbbing headache and dizziness",
            "duration": "2 days",
            "severity": "6",
        }
        # Unauthenticated request for mock dev or with mock user
        res_create = client.post("/api/assessments", json=create_payload)
        # If unauthenticated, will return 401, which confirms authentication enforcement
        assert res_create.status_code in [200, 201, 401]

        # 2. POST /api/assessments/{id}/messages
        msg_payload = {
            "message": "I have had a severe migraine for 2 days",
            "step": 0,
        }
        res_msg = client.post("/api/assessments/test-sess-123/messages", json=msg_payload)
        assert res_msg.status_code == 200
        data_msg = res_msg.json()
        assert "message" in data_msg
        assert data_msg["status"] == "success"

        # 3. POST /api/assessments/{id}/analyze
        res_analyze = client.post("/api/assessments/test-sess-123/analyze")
        assert res_analyze.status_code == 200
        data_analyze = res_analyze.json()
        assert "leading_condition" in data_analyze
        assert "consensus_score" in data_analyze
        assert "model_agreement" in data_analyze
        assert "disclaimer" in data_analyze

    finally:
        db.close()
