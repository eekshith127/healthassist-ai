import jwt
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.user import User
from backend.app.models.health_profile import HealthProfile
from backend.app.models.assessment import Assessment

client = TestClient(app)

# Helper function to generate test JWT token
def create_test_jwt(sub: str, email: str = "test@example.com", name: str = "Test User"):
    payload = {
        "sub": sub,
        "email": email,
        "name": name,
    }
    return jwt.encode(payload, "secret", algorithm="HS256")


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up after tests
    db = SessionLocal()
    try:
        db.query(Assessment).delete()
        db.query(HealthProfile).delete()
        db.query(User).delete()
        db.commit()
    finally:
        db.close()


def test_unauthenticated_request_rejected():
    """Unauthenticated requests to protected endpoints must return 401 Unauthorized."""
    response = client.get("/api/me")
    assert response.status_code == 401
    assert "Missing Authorization Header" in response.json()["detail"]

    response = client.get("/api/profile")
    assert response.status_code == 401

    response = client.get("/api/assessments")
    assert response.status_code == 401


def test_authenticated_me_new_user():
    """Valid Clerk token creates local User record and indicates incomplete profile."""
    token = create_test_jwt(sub="user_clerk_12345", email="patient@healthassist.care", name="John Patient")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["clerk_user_id"] == "user_clerk_12345"
    assert data["email"] == "patient@healthassist.care"
    assert data["name"] == "John Patient"
    assert data["profile_completed"] is False


def test_health_profile_lifecycle():
    """Updating health profile sets profile_completed to True."""
    token = create_test_jwt(sub="user_clerk_profile_test", email="profile@healthassist.care", name="Jane Profile")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Check me before profile
    me_res = client.get("/api/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["profile_completed"] is False

    # 2. Update profile with required health indicators
    profile_payload = {
        "age": 34,
        "gender": "Female",
        "blood_type": "A-Positive (A+)",
        "allergies": "Penicillin",
        "emergency_contact": "Bob Profile",
        "emergency_phone": "+1 (555) 123-4567",
    }
    put_res = client.put("/api/profile", json=profile_payload, headers=headers)
    assert put_res.status_code == 200
    profile_data = put_res.json()
    assert profile_data["blood_type"] == "A-Positive (A+)"
    assert profile_data["is_completed"] is True

    # 3. Check me after profile
    me_after = client.get("/api/me", headers=headers)
    assert me_after.status_code == 200
    assert me_after.json()["profile_completed"] is True


def test_assessment_isolation_between_users():
    """User A cannot access or see assessments created by User B."""
    token_a = create_test_jwt(sub="user_a_clerk", email="usera@healthassist.care", name="User A")
    token_b = create_test_jwt(sub="user_b_clerk", email="userb@healthassist.care", name="User B")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an assessment
    create_res = client.post(
        "/api/assessments",
        json={"symptoms": "Mild headache and seasonal allergies", "severity": "Mild"},
        headers=headers_a,
    )
    assert create_res.status_code == 201
    assessment_a_id = create_res.json()["id"]

    # User A can view their assessment
    res_a = client.get(f"/api/assessments/{assessment_a_id}", headers=headers_a)
    assert res_a.status_code == 200
    assert res_a.json()["id"] == assessment_a_id

    # User B list assessments - should be empty
    list_b = client.get("/api/assessments", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # User B attempts to access User A's assessment by ID - returns 404 (not leaking existence)
    res_b = client.get(f"/api/assessments/{assessment_a_id}", headers=headers_b)
    assert res_b.status_code == 404
    assert res_b.json()["detail"] == "Assessment record not found."
