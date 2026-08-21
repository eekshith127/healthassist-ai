"""Unit and Integration tests for Conversational Intake AI, LLM Provider, and PatientCase persistence."""

import json
import pytest
import jwt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database.session import get_db, SessionLocal
from backend.app.models.user import User
from backend.app.models.patient_case import PatientCaseModel
from backend.app.schemas.intake import (
    PatientCase,
    IntakeOutput,
    IntakeMessageRequest,
    IntakeMessageResponse,
)
from backend.app.schemas.health_profile import PatientCaseContext
from backend.app.ai.intake_agent import IntakeAgent, intake_agent
from backend.app.ai.llm_provider import (
    BaseLLMProvider,
    MockLLMProvider,
    GeminiProvider,
    OpenAIProvider,
    AnthropicProvider,
    get_llm_provider,
)
from backend.app.utils.config import settings

client = TestClient(app)


def create_test_auth_headers(sub: str = "user_intake_test_123"):
    payload = {
        "sub": sub,
        "email": "intake_test@healthassist.care",
        "name": "Intake Test Patient",
    }
    token = jwt.encode(payload, "secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def db_session():
    """Provides a transactional database session for tests."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.mark.asyncio
async def test_intake_agent_turn_1_initial_complaint(db_session: Session):
    """Test Intake AI understands user complaint and asks 1-2 focused follow-up questions."""
    agent = IntakeAgent(provider=MockLLMProvider())

    result = await agent.process_turn(
        user_message="I have had a throbbing headache for the last few hours",
        conversation_history=[],
        health_profile=None,
        db=db_session,
    )

    assert isinstance(result, IntakeOutput)
    assert result.patient_case.main_complaint != ""
    assert "headache" in result.patient_case.main_complaint.lower() or any(
        "headache" in s.lower() for s in result.patient_case.symptoms
    )
    # Information should not be complete after just turn 1
    assert result.information_complete is False
    # Should ask follow-up questions (duration / severity scale 1-10)
    assert "?" in result.assistant_message
    assert "scale" in result.assistant_message.lower() or "how long" in result.assistant_message.lower() or "1" in result.assistant_message


@pytest.mark.asyncio
async def test_intake_agent_turn_2_duration_and_severity(db_session: Session):
    """Test Intake AI collects missing duration and severity rating."""
    agent = IntakeAgent(provider=MockLLMProvider())

    history = [
        {"role": "user", "content": "I have a cough and chest congestion"},
        {
            "role": "assistant",
            "content": "How long have you had these symptoms, and how would you rate your discomfort from 1 to 10?",
        },
    ]

    result = await agent.process_turn(
        user_message="It has been going on for 3 days and the discomfort is around 5 out of 10",
        conversation_history=history,
        health_profile=None,
        db=db_session,
    )

    assert isinstance(result, IntakeOutput)
    assert result.patient_case.duration is not None
    assert "3 days" in result.patient_case.duration or "3" in str(result.patient_case.duration)
    assert result.patient_case.severity == 5 or result.patient_case.severity == "5"


@pytest.mark.asyncio
async def test_intake_agent_turn_3_completion_and_persistence(db_session: Session):
    """Test Intake AI completes intake when all details are gathered and saves PatientCase."""
    agent = IntakeAgent(provider=MockLLMProvider())

    # Create a test user in the DB
    test_user = db_session.query(User).filter(User.clerk_user_id == "user_intake_save_test").first()
    if not test_user:
        test_user = User(
            clerk_user_id="user_intake_save_test",
            email="intake_save@healthassist.care",
            name="Intake Save User",
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

    history = [
        {"role": "user", "content": "I have had a severe sore throat and fever for 2 days, pain rating is 7/10"},
        {
            "role": "assistant",
            "content": "Did this start suddenly or gradually, and are you experiencing other symptoms?",
        },
    ]

    result = await agent.process_turn(
        user_message="It started gradually after a cold, no breathing trouble or other symptoms",
        conversation_history=history,
        health_profile=None,
        db=db_session,
        user_id=test_user.id,
        assessment_id="TEST-SESSION-CASE-001",
    )

    assert isinstance(result, IntakeOutput)
    assert result.information_complete is True
    assert result.patient_case.main_complaint != ""

    # Verify PatientCase is persisted in the database
    saved_case = (
        db_session.query(PatientCaseModel)
        .filter(
            PatientCaseModel.user_id == test_user.id,
            PatientCaseModel.assessment_id == "TEST-SESSION-CASE-001",
        )
        .first()
    )
    assert saved_case is not None
    assert saved_case.information_complete is True
    schema_case = saved_case.to_schema()
    assert isinstance(schema_case, PatientCase)
    assert schema_case.main_complaint != ""


@pytest.mark.asyncio
async def test_intake_agent_persistent_health_profile_context(db_session: Session):
    """Test Intake AI incorporates persistent health profile (chronic conditions, allergies)."""
    agent = IntakeAgent(provider=MockLLMProvider())

    context = PatientCaseContext(
        age=52,
        sex="female",
        bmi_category="Normal",
        relevant_conditions=["Asthma", "Hypertension"],
        critical_allergies=["Penicillin", "Sulfa drugs"],
        active_medications=["Albuterol inhaler", "Lisinopril 10mg"],
    )

    prompt = agent._build_context_prompt(
        user_message="I have a worsening wheezing cough",
        conversation_history=[],
        health_profile=context,
    )

    # Health context must be explicitly formatted in prompt
    assert "Asthma" in prompt
    assert "Penicillin" in prompt
    assert "Albuterol inhaler" in prompt
    assert "Age: 52" in prompt
    assert "Sex: female" in prompt

    result = await agent.process_turn(
        user_message="I have a worsening wheezing cough",
        conversation_history=[],
        health_profile=context,
        db=db_session,
    )
    assert isinstance(result, IntakeOutput)
    assert result.patient_case.main_complaint != ""


@pytest.mark.asyncio
async def test_intake_agent_red_flag_identification(db_session: Session):
    """Test Intake AI identifies red-flag emergency symptoms for the safety layer."""
    agent = IntakeAgent(provider=MockLLMProvider())

    result = await agent.process_turn(
        user_message="I have sudden chest pressure and shortness of breath with dizziness",
        conversation_history=[],
        health_profile=None,
        db=db_session,
    )

    assert isinstance(result, IntakeOutput)
    assert len(result.patient_case.red_flags) > 0
    assert any(
        "chest" in rf or "breath" in rf for rf in result.patient_case.red_flags
    )
    assert "emergency" in result.assistant_message.lower() or "urgent" in result.assistant_message.lower()
    # Emergency cases should mark information_complete so downstream safety acts promptly
    assert result.information_complete is True


@pytest.mark.asyncio
async def test_intake_agent_negative_constraints():
    """Verify Intake AI does not prescribe medication or provide definitive diagnoses in prompt instruction."""
    agent = IntakeAgent(provider=MockLLMProvider())
    system_instruction = agent.system_prompt

    assert "DO NOT provide a definitive diagnosis" in system_instruction
    assert "DO NOT prescribe medication" in system_instruction
    assert "DO NOT invent" in system_instruction
    assert "DO NOT claim certainty" in system_instruction
    assert "ask only ONE or TWO" in system_instruction


def test_llm_provider_abstraction():
    """Test provider-independent factory and interface adapters."""
    # Test Mock Provider
    mock_p = get_llm_provider("mock")
    assert isinstance(mock_p, MockLLMProvider)

    # Test Gemini Provider
    gemini_p = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    assert gemini_p.api_key == "test-key"
    assert gemini_p.model == "gemini-1.5-flash"
    assert isinstance(gemini_p, BaseLLMProvider)

    # Test OpenAI Provider
    openai_p = OpenAIProvider(api_key="test-key", model="gpt-4o-mini")
    assert openai_p.api_key == "test-key"
    assert openai_p.model == "gpt-4o-mini"
    assert isinstance(openai_p, BaseLLMProvider)

    # Test Anthropic Provider
    anthropic_p = AnthropicProvider(api_key="test-key", model="claude-3-5-sonnet-20241022")
    assert anthropic_p.api_key == "test-key"
    assert anthropic_p.model == "claude-3-5-sonnet-20241022"
    assert isinstance(anthropic_p, BaseLLMProvider)


def test_api_intake_message_endpoint():
    """Test HTTP POST /api/v1/intake/message multi-turn endpoint."""
    # Turn 1
    resp1 = client.post(
        "/api/v1/intake/message",
        json={
            "message": "I have had a mild headache and runny nose",
            "conversation_history": [],
            "assessment_id": "HA-INTAKE-TEST-001",
        },
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert "assistant_message" in data1
    assert data1["information_complete"] is False
    assert data1["patient_case"]["main_complaint"] != ""

    # Turn 2 with history
    resp2 = client.post(
        "/api/v1/intake/message",
        json={
            "message": "It has been about 2 days, discomfort is 4 out of 10",
            "conversation_history": [
                {"role": "user", "content": "I have had a mild headache and runny nose"},
                {"role": "assistant", "content": data1["assistant_message"]},
            ],
            "assessment_id": "HA-INTAKE-TEST-001",
        },
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert "assistant_message" in data2
    assert data2["patient_case"]["duration"] is not None


def test_api_intake_cases_crud():
    """Test saving and retrieving PatientCase records via API."""
    headers = create_test_auth_headers("user_crud_cases_test")

    # Complete an intake session for this user
    resp = client.post(
        "/api/v1/intake/message",
        json={
            "message": "It started gradually after cold air exposure, no other red flags",
            "conversation_history": [
                {"role": "user", "content": "I have had a cough for 4 days, discomfort 5/10"},
                {"role": "assistant", "content": "Did it start suddenly or gradually?"},
            ],
            "assessment_id": "HA-INTAKE-CRUD-001",
        },
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["information_complete"] is True

    # Retrieve patient cases list
    list_resp = client.get("/api/v1/intake/cases", headers=headers)
    assert list_resp.status_code == 200
    cases = list_resp.json()
    assert len(cases) >= 1
    assert cases[0]["main_complaint"] != ""
