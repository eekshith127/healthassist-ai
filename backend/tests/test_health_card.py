import jwt
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def create_test_auth_headers(sub: str = "user_test_health_card_1", name: str = "Priya Sharma"):
    payload = {
        "sub": sub,
        "email": f"{sub}@trishulai.in",
        "name": name,
    }
    token = jwt.encode(payload, "secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_health_card_share_lifecycle():
    headers_user_a = create_test_auth_headers(sub="user_card_a_101", name="Aarav Mehta")
    
    # 1. Update user A profile with Indian phone & emergency contact
    profile_payload = {
        "date_of_birth": "1992-06-20",
        "sex": "male",
        "height_cm": 175.0,
        "weight_kg": 72.0,
        "blood_group": "B+",
        "medical_conditions": ["Mild Hypertension"],
        "medications": ["Amlodipine 5mg"],
        "allergies": ["Penicillin (Severe anaphylaxis)"],
        "emergency_contact": "Rukmini Mehta",
        "emergency_phone": "9876543210",
    }
    prof_res = client.put("/api/profile", json=profile_payload, headers=headers_user_a)
    assert prof_res.status_code == 200

    # 2. Get initial share status (should be inactive)
    res = client.get("/api/health-card/share", headers=headers_user_a)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # 3. Generate QR Share Token
    gen_res = client.post("/api/health-card/share", headers=headers_user_a)
    assert gen_res.status_code == 200
    data = gen_res.json()
    assert data["is_active"] is True
    token = data["token"]
    assert token is not None
    assert len(token) >= 32  # Cryptographically random token (32+ bytes URL-safe)

    # 4. Access via public read-only endpoint (no authentication required)
    pub_res = client.get(f"/api/health-card/public/{token}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()

    # Verify Patient & Clinical Baseline
    assert pub_data["patient_name"] == "Aarav Mehta"
    assert pub_data["blood_group"] == "B+"
    assert pub_data["height_cm"] == 175.0
    assert pub_data["weight_kg"] == 72.0
    assert pub_data["bmi"] == 23.5
    assert "Penicillin (Severe anaphylaxis)" in pub_data["allergies"]
    assert "Mild Hypertension" in pub_data["medical_conditions"]
    assert "Amlodipine 5mg" in pub_data["medications"]

    # Verify Emergency Contacts & Hotlines
    assert pub_data["emergency_contact"] == "Rukmini Mehta"
    assert pub_data["emergency_phone"] == "+91 98765 43210"
    assert pub_data["emergency_phone_dial"] == "+919876543210"
    assert pub_data["national_emergency_dispatch"] == "112"
    assert pub_data["national_emergency_dispatch_dial"] == "tel:112"
    assert pub_data["poison_control_centre"] == "1800-116-117"
    assert pub_data["poison_control_centre_dial"] == "tel:1800116117"

    # Privacy boundaries: strictly check that private IDs, emails, chat/assessments are NOT returned
    assert "user_id" not in pub_data
    assert "clerk_user_id" not in pub_data
    assert "email" not in pub_data
    assert "assessments" not in pub_data
    assert "chats" not in pub_data
    assert "patient_cases" not in pub_data

    # 5. Revoke the share token
    revoke_res = client.post("/api/health-card/share/revoke", headers=headers_user_a)
    assert revoke_res.status_code == 200
    assert revoke_res.json()["revoked"] is True

    # 6. Scanned old QR code now returns 404 (access denied)
    revoked_pub_res = client.get(f"/api/health-card/public/{token}")
    assert revoked_pub_res.status_code == 404
    assert "revoked" in revoked_pub_res.json()["detail"].lower()

    # 7. Generate a new token after revocation
    new_gen_res = client.post("/api/health-card/share", headers=headers_user_a)
    assert new_gen_res.status_code == 200
    new_token = new_gen_res.json()["token"]
    assert new_token != token

    # New token is accessible
    new_pub_res = client.get(f"/api/health-card/public/{new_token}")
    assert new_pub_res.status_code == 200


def test_public_health_card_security_boundaries():
    # 1. Invalid or random token should return 404
    res_fake = client.get("/api/health-card/public/nonexistent_random_token_12345678")
    assert res_fake.status_code == 404

    # 2. Database ID cannot be substituted for token
    res_id = client.get("/api/health-card/public/1")
    assert res_id.status_code == 404

    # 3. User B cannot revoke User A's token
    headers_user_a = create_test_auth_headers(sub="user_sec_a", name="User A")
    headers_user_b = create_test_auth_headers(sub="user_sec_b", name="User B")

    gen_res = client.post("/api/health-card/share", headers=headers_user_a)
    token_a = gen_res.json()["token"]

    # User B revokes their own tokens (should not affect User A's token)
    client.post("/api/health-card/share/revoke", headers=headers_user_b)

    # User A's token is still valid
    res_a = client.get(f"/api/health-card/public/{token_a}")
    assert res_a.status_code == 200
