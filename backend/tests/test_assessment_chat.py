import jwt
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def create_test_auth_headers(sub: str = "user_test_assessment_id"):
    payload = {
        "sub": sub,
        "email": "test_assessment@healthassist.care",
        "name": "Test Assessment User",
    }
    token = jwt.encode(payload, "secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_post_assessment_greeting():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "hi how r u", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert data["step"] == 0
    assert "doing well" in data["message"].lower() or "healthassist" in data["message"].lower()
    assert len(data["options"]) > 0


def test_post_assessment_time_query():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "what time is it?", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert "current time is" in data["message"].lower() or ":" in data["message"]


def test_post_assessment_identity_query():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "who are you and what can you do?", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert "healthassist" in data["message"].lower()
    assert "triage" in data["message"].lower() or "symptom" in data["message"].lower()



def test_post_assessment_message_step_0():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "I have had a mild headache and runny nose", "step": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert data["step"] == 1
    assert "duration" in data["message"].lower() or "how long" in data["message"].lower()
    assert data["options"] is not None
    assert len(data["options"]) > 0



def test_post_assessment_message_step_1_red_flags():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "About 2 days, discomfort is moderate (4/10)", "step": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert data["step"] == 2
    assert "red flag" in data["message"].lower() or "fever" in data["message"].lower()
    assert len(data["options"]) > 0


def test_post_assessment_message_step_2_consensus_summary():
    response = client.post(
        "/api/assessments/test-sess-100/messages",
        json={"message": "None of these red flags apply to me", "step": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert data["step"] == 3
    assert data["assessment_summary"] is not None
    assert data["assessment_summary"]["triage_level"] == "non-urgent"
    assert "Multi-LLM Consensus" in data["message"] or "Consensus" in data["message"]


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
    assert "acetaminophen" in data["message"].lower() or "telehealth" in data["message"].lower()
