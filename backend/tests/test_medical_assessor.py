"""Unit and integration tests for Multi-LLM Medical Assessor Module."""

import asyncio
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database.session import Base, engine, get_db
from backend.app.models.patient_case import PatientCaseModel
from backend.app.models.model_assessment import ModelAssessment
from backend.app.schemas.intake import PatientCase
from backend.app.schemas.medical_assessment import (
    PossibleCondition,
    ModelAssessmentOutput,
    MultiModelAssessmentResponse,
)
from backend.app.ai.model_config import (
    ModelConfig,
    MultiModelAssessmentConfig,
    get_default_model_configs,
    get_default_multi_model_config,
)
from backend.app.ai.provider_adapters import (
    BaseProviderAdapter,
    MockProviderAdapter,
    GeminiProviderAdapter,
    OpenAIProviderAdapter,
    AnthropicProviderAdapter,
    get_provider_adapter,
    register_provider_adapter,
    ProviderTimeoutException,
    ProviderRateLimitException,
    ProviderInvalidJSONException,
    ProviderMissingResponseException,
    ProviderException,
)
from backend.app.ai.medical_assessor import (
    MultiLLMMedicalAssessor,
    assess_patient_case,
)


@pytest.fixture
def sample_patient_case():
    return PatientCase(
        main_complaint="Persistent dry cough and fever",
        symptoms=["cough", "fever", "throat pain"],
        duration="4 days",
        severity=6,
        onset="gradual",
        associated_symptoms=["mild fatigue", "nasal congestion"],
        red_flags=[],
    )


@pytest.fixture
def acute_chest_patient_case():
    return PatientCase(
        main_complaint="Sharp retrosternal chest pain",
        symptoms=["chest pain", "shortness of breath"],
        duration="2 hours",
        severity=8,
        onset="sudden",
        associated_symptoms=["diaphoresis"],
        red_flags=["chest pain", "shortness of breath"],
    )


@pytest.mark.asyncio
async def test_multi_llm_medical_assessor_default_mock_execution(sample_patient_case):
    """Verifies that all 3 default models (A, B, C) receive the normalized PatientCase and return conforming output."""
    assessor = MultiLLMMedicalAssessor()
    assert len(assessor.adapters) == 3

    response: MultiModelAssessmentResponse = await assessor.assess_case(sample_patient_case)

    assert response.status == "completed"
    assert response.successful_models_count == 3
    assert response.total_models_count == 3
    assert len(response.failures) == 0
    assert "model_a" in response.assessments
    assert "model_b" in response.assessments
    assert "model_c" in response.assessments

    # Verify clinical disclaimers are intact
    assert "not definitive medical diagnoses" in response.disclaimer.lower()
    assert "clinical probabilities" in response.disclaimer.lower()

    # Validate output schema conformance across all models
    for model_id, assessment in response.assessments.items():
        assert isinstance(assessment, ModelAssessmentOutput)
        assert len(assessment.possible_conditions) > 0
        assert assessment.severity in ["mild", "moderate", "severe", "critical"]
        assert isinstance(assessment.red_flags, list)
        assert isinstance(assessment.recommended_specialty, str)
        assert len(assessment.recommended_specialty) > 0

        # Validate condition fields
        for condition in assessment.possible_conditions:
            assert isinstance(condition, PossibleCondition)
            assert condition.name
            assert isinstance(condition.assessment_score, (int, float))
            assert 0 <= condition.assessment_score <= 100
            assert isinstance(condition.supporting_factors, list)
            assert isinstance(condition.contradicting_factors, list)
            assert isinstance(condition.missing_information, list)


@pytest.mark.asyncio
async def test_concurrent_execution(sample_patient_case):
    """Verifies that Model A, B, and C execute concurrently in parallel."""
    # Create 3 adapters that each take 0.1s
    cfg_a = ModelConfig(model_id="model_a", display_name="Model A", provider="mock", model_name="mock-a", mock_mode=True)
    cfg_b = ModelConfig(model_id="model_b", display_name="Model B", provider="mock", model_name="mock-b", mock_mode=True)
    cfg_c = ModelConfig(model_id="model_c", display_name="Model C", provider="mock", model_name="mock-c", mock_mode=True)

    adapters = [
        MockProviderAdapter(cfg_a),
        MockProviderAdapter(cfg_b),
        MockProviderAdapter(cfg_c),
    ]

    assessor = MultiLLMMedicalAssessor(adapters=adapters)
    start = asyncio.get_event_loop().time()
    response = await assessor.assess_case(sample_patient_case)
    total_time = asyncio.get_event_loop().time() - start

    assert response.successful_models_count == 3
    # 3 concurrent calls of 0.05s should take well under 0.15s
    assert total_time < 0.25


@pytest.mark.asyncio
async def test_partial_failure_resilience(sample_patient_case):
    """If one model fails (e.g. Model B times out), Model A and Model C continue and failure is recorded."""
    cfg_a = ModelConfig(model_id="model_a", display_name="Model A", provider="mock", model_name="mock-a", mock_mode=True)
    cfg_b = ModelConfig(model_id="model_b", display_name="Model B", provider="mock", model_name="mock-b", mock_mode=True)
    cfg_c = ModelConfig(model_id="model_c", display_name="Model C", provider="mock", model_name="mock-c", mock_mode=True)

    adapters = [
        MockProviderAdapter(cfg_a),
        MockProviderAdapter(cfg_b, simulated_failure="timeout"),
        MockProviderAdapter(cfg_c),
    ]

    assessor = MultiLLMMedicalAssessor(adapters=adapters)
    response = await assessor.assess_case(sample_patient_case)

    assert response.status == "partial_success"
    assert response.successful_models_count == 2
    assert response.total_models_count == 3
    assert "model_a" in response.assessments
    assert "model_c" in response.assessments
    assert "model_b" not in response.assessments

    assert "model_b" in response.failures
    assert response.failures["model_b"].error_type == "timeout"
    assert "timed out" in response.failures["model_b"].error_message.lower()


@pytest.mark.asyncio
async def test_rate_limit_and_invalid_json_handling(sample_patient_case):
    """Tests rate limit (429) and invalid JSON error resilience."""
    cfg_a = ModelConfig(model_id="model_a", display_name="Model A", provider="mock", model_name="mock-a", mock_mode=True)
    cfg_b = ModelConfig(model_id="model_b", display_name="Model B", provider="mock", model_name="mock-b", mock_mode=True)
    cfg_c = ModelConfig(model_id="model_c", display_name="Model C", provider="mock", model_name="mock-c", mock_mode=True)

    adapters = [
        MockProviderAdapter(cfg_a, simulated_failure="rate_limit"),
        MockProviderAdapter(cfg_b, simulated_failure="invalid_json"),
        MockProviderAdapter(cfg_c),
    ]

    assessor = MultiLLMMedicalAssessor(adapters=adapters)
    response = await assessor.assess_case(sample_patient_case)

    assert response.status == "partial_success"
    assert response.successful_models_count == 1
    assert "model_c" in response.assessments
    assert response.failures["model_a"].error_type == "rate_limit"
    assert response.failures["model_b"].error_type == "invalid_json"


@pytest.mark.asyncio
async def test_provider_outage_handling(sample_patient_case):
    """Tests provider 500 error and missing response handling."""
    cfg_a = ModelConfig(model_id="model_a", display_name="Model A", provider="mock", model_name="mock-a", mock_mode=True)
    cfg_b = ModelConfig(model_id="model_b", display_name="Model B", provider="mock", model_name="mock-b", mock_mode=True)

    adapters = [
        MockProviderAdapter(cfg_a, simulated_failure="provider_error"),
        MockProviderAdapter(cfg_b, simulated_failure="missing_response"),
    ]

    assessor = MultiLLMMedicalAssessor(adapters=adapters)
    response = await assessor.assess_case(sample_patient_case)

    assert response.status == "failed"
    assert response.successful_models_count == 0
    assert response.total_models_count == 2
    assert response.failures["model_a"].error_type == "provider_error"
    assert response.failures["model_b"].error_type == "missing_response"


@pytest.mark.asyncio
async def test_acute_emergency_red_flags_detection(acute_chest_patient_case):
    """Verifies that acute cardiovascular symptoms trigger red flags and severe rating."""
    assessor = MultiLLMMedicalAssessor()
    response = await assessor.assess_case(acute_chest_patient_case)

    assert response.status == "completed"
    for model_id, assessment in response.assessments.items():
        assert assessment.severity == "severe"
        assert len(assessment.red_flags) > 0
        condition_names = [c.name.lower() for c in assessment.possible_conditions]
        assert any("coronary" in n or "cardiovascular" in n or "chest" in n for n in condition_names)


@pytest.mark.asyncio
async def test_swappable_custom_provider_adapter(sample_patient_case):
    """Tests that custom provider adapters can be registered and swapped seamlessly."""
    class CustomEHRModelAdapter(BaseProviderAdapter):
        async def evaluate_case(self, patient_case: PatientCase, system_instruction=None):
            output = ModelAssessmentOutput(
                possible_conditions=[
                    PossibleCondition(
                        name="EHR Custom Analyzed Condition",
                        assessment_score=95,
                        supporting_factors=["Custom EHR Factor"],
                        contradicting_factors=[],
                        missing_information=["Specialist Consult"],
                    )
                ],
                severity="mild",
                red_flags=[],
                recommended_specialty="Preventive Care",
            )
            return output, {"custom": "ehr_raw_data"}

    register_provider_adapter("ehr_custom", CustomEHRModelAdapter)

    cfg = ModelConfig(
        model_id="model_custom",
        display_name="Custom EHR Model",
        provider="ehr_custom",
        model_name="ehr-expert-v1",
    )
    adapter = get_provider_adapter(cfg)
    assessor = MultiLLMMedicalAssessor(adapters=[adapter])

    response = await assessor.assess_case(sample_patient_case)
    assert response.successful_models_count == 1
    assert "model_custom" in response.assessments
    assert response.assessments["model_custom"].possible_conditions[0].name == "EHR Custom Analyzed Condition"


def test_json_cleaner_and_parser():
    """Verifies markdown stripping and JSON extraction in BaseProviderAdapter."""
    cfg = ModelConfig(model_id="test", display_name="Test", provider="mock", model_name="test")
    adapter = MockProviderAdapter(cfg)

    # Markdown wrapped JSON
    raw_markdown = """```json
    {
      "possible_conditions": [
        {
          "name": "Migraine",
          "assessment_score": 80,
          "supporting_factors": ["unilateral headache"],
          "contradicting_factors": [],
          "missing_information": []
        }
      ],
      "severity": "moderate",
      "red_flags": [],
      "recommended_specialty": "Neurology"
    }
    ```"""
    output, raw_dict = adapter.clean_and_parse_json(raw_markdown)
    assert output.possible_conditions[0].name == "Migraine"
    assert output.recommended_specialty == "Neurology"

    # Malformed JSON should raise ProviderInvalidJSONException
    with pytest.raises(ProviderInvalidJSONException):
        adapter.clean_and_parse_json("{ broken json")

    # Empty string should raise ProviderMissingResponseException
    with pytest.raises(ProviderMissingResponseException):
        adapter.clean_and_parse_json("")


@pytest.mark.asyncio
async def test_database_persistence_of_raw_outputs(sample_patient_case):
    """Tests that raw model outputs are securely persisted in ModelAssessment database records."""
    from backend.app.database.session import SessionLocal

    db: Session = SessionLocal()
    try:
        from backend.app.models.user import User
        from backend.app.models.assessment import Assessment
        import uuid

        # Create isolated user and assessment record in DB
        test_user = User(
            clerk_user_id=f"clerk_test_persist_{uuid.uuid4().hex[:8]}",
            email=f"persist_{uuid.uuid4().hex[:8]}@example.com",
            name="Persist Test Patient",
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        assessment = Assessment(
            user_id=test_user.id,
            symptoms="cough and fever",
            triage_level="non-urgent",
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Clear any preexisting rows for this specific assessment_id
        db.query(ModelAssessment).filter(ModelAssessment.assessment_id == assessment.id).delete()
        db.commit()

        assessor = MultiLLMMedicalAssessor()
        response = await assessor.assess_case(
            patient_case=sample_patient_case,
            assessment_id=assessment.id,
            db=db,
            save_to_db=True,
        )

        assert response.successful_models_count == 3

        # Query model_assessments table
        records = db.query(ModelAssessment).filter(ModelAssessment.assessment_id == assessment.id).all()
        assert len(records) == 3
        for r in records:
            assert r.model_name
            parsed_result = json.loads(r.result)
            assert "possible_conditions" in parsed_result
            assert r.confidence is not None

    finally:
        db.close()


def test_api_multi_model_assessment_endpoint(sample_patient_case):
    """Tests POST /api/v1/assessment/multi-model endpoint."""
    client = TestClient(app)

    payload = {
        "patient_case": sample_patient_case.model_dump(),
        "save_to_db": False,
    }

    response = client.post("/api/v1/assessment/multi-model", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] in ["completed", "partial_success"]
    assert data["successful_models_count"] >= 1
    assert "assessments" in data
    assert "disclaimer" in data
    assert "patient_case" in data
    assert data["patient_case"]["main_complaint"] == sample_patient_case.main_complaint


def test_api_assess_saved_patient_case_endpoint():
    """Tests POST /api/v1/assessment/cases/{case_id}/assess endpoint."""
    from backend.app.database.session import SessionLocal

    db: Session = SessionLocal()
    client = TestClient(app)
    try:
        # Create a saved PatientCase in database
        case_rec = PatientCaseModel(
            main_complaint="Sinus Headache",
            symptoms=json.dumps(["headache", "facial pressure"]),
            duration="3 days",
            severity="5",
            onset="gradual",
            associated_symptoms=json.dumps(["rhinorrhea"]),
            red_flags=json.dumps([]),
            information_complete=True,
        )
        db.add(case_rec)
        db.commit()
        db.refresh(case_rec)

        response = client.post(f"/api/v1/assessment/cases/{case_rec.id}/assess")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "completed"
        assert data["successful_models_count"] == 3
        assert "model_a" in data["assessments"]
        assert data["patient_case"]["main_complaint"] == "Sinus Headache"

    finally:
        db.close()
