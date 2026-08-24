import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_post_assessment_message_greeting():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "hello", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "TRISHUL AI" in data["message"]
    assert len(data["options"]) > 0


def test_post_assessment_message_time():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "what is the current time?", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert "current time is" in data["message"].lower()


def test_post_assessment_message_identity():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "who are you?", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert "TRISHUL AI" in data["message"]
    assert "Consensus" in data["message"]


def test_post_assessment_message_step0_symptoms():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "I have a headache and nasal congestion for 2 days", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["step"] == 1
    assert len(data["options"]) > 0


def test_post_assessment_message_step1_redflags():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "discomfort is mild, around 3/10", "step": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["step"] == 2
    assert "red flags" in data["message"].lower()


def test_post_assessment_message_step2_trigger_pipeline():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "None of these red flags apply to me.", "step": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["step"] == 3
    assert data["assessment_summary"] is not None
    summary = data["assessment_summary"]
    assert "consensus_score" in summary
    assert "triage_level" in summary
    assert "differentialDiagnoses" in summary
    assert len(summary["differentialDiagnoses"]) > 0


def test_post_assessment_message_emergency():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "I have severe chest pressure and shortness of breath", "step": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assessment_summary"]["triage_level"] == "emergency"
    assert "CRITICAL" in data["message"] or "emergency" in data["message"].lower()


def test_post_assessment_message_followup():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "What medication should I take for headache?", "step": 3},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["step"] == 4
    assert data["status"] == "success"
    assert len(data["message"]) > 10
