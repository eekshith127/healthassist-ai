import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.health_profile_service import health_profile_service
from backend.app.schemas.health_profile import HealthProfileResponse

client = TestClient(app)


def test_get_profile_endpoint():
    response = client.get("/api/profile")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "user_id" in data
    assert "bmi" in data
    assert "bmi_category" in data
    assert "age" in data
    assert isinstance(data["medical_conditions"], list)
    assert isinstance(data["allergies"], list)
    assert isinstance(data["medications"], list)


def test_update_profile_endpoint():
    payload = {
        "date_of_birth": "1990-01-15",
        "sex": "female",
        "height_cm": 165.0,
        "weight_kg": 58.0,
        "blood_group": "A+",
        "medical_conditions": ["Seasonal Allergic Rhinitis"],
        "medications": ["Cetirizine 10mg"],
        "allergies": ["Latex (Mild)", "Sulfa Drugs (Moderate)"],
        "previous_surgeries": ["Tonsillectomy (2005)"],
        "family_history": ["Asthma"],
    }
    response = client.put("/api/profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["sex"] == "female"
    assert data["height_cm"] == 165.0
    assert data["weight_kg"] == 58.0
    assert data["blood_group"] == "A+"
    assert "Latex (Mild)" in data["allergies"]
    assert "Seasonal Allergic Rhinitis" in data["medical_conditions"]
    # 58 / (1.65^2) = 21.3
    assert data["bmi"] == 21.3
    assert data["bmi_category"] == "Normal weight"
    assert data["profile_completed"] is True


def test_bmi_service_calculations():
    # Normal
    bmi, cat = health_profile_service.calculate_bmi(180, 75)
    assert bmi == 23.1
    assert cat == "Normal weight"

    # Underweight
    bmi, cat = health_profile_service.calculate_bmi(180, 50)
    assert bmi == 15.4
    assert cat == "Underweight"

    # Overweight
    bmi, cat = health_profile_service.calculate_bmi(170, 78)
    assert bmi == 27.0
    assert cat == "Overweight"

    # Obese
    bmi, cat = health_profile_service.calculate_bmi(170, 95)
    assert bmi == 32.9
    assert cat == "Obese"

    # Invalid
    bmi, cat = health_profile_service.calculate_bmi(0, 0)
    assert bmi is None
    assert cat is None


def test_age_calculation():
    age = health_profile_service.calculate_age("1994-05-14")
    assert age is not None
    assert age >= 30

    assert health_profile_service.calculate_age("invalid-date") is None
    assert health_profile_service.calculate_age(None) is None


def test_selective_clinical_context_privacy():
    mock_dto = HealthProfileResponse(
        id=1,
        user_id=1,
        date_of_birth="1990-01-01",
        sex="female",
        height_cm=165.0,
        weight_kg=60.0,
        blood_group="O+",
        medical_conditions=["Asthma", "Hyperlipidemia", "GERD"],
        medications=["Albuterol", "Atorvastatin"],
        allergies=["Penicillin"],
        previous_surgeries=["Appendectomy"],
        family_history=["Diabetes"],
        bmi=22.0,
        bmi_category="Normal weight",
        age=36,
        profile_completed=True,
    )

    # When querying for cough/respiratory complaint
    context = health_profile_service.get_selective_clinical_context(
        mock_dto, chief_complaint="Persistent wheezing and dry cough for 3 days"
    )

    assert context.age == 36
    assert context.sex == "female"
    assert "Penicillin" in context.critical_allergies
    assert "Filtered minimal clinical context" in context.privacy_notice


def test_get_clinical_context_endpoint():
    response = client.get(
        "/api/profile/clinical-context?chief_complaint=chest%20pressure"
    )
    assert response.status_code == 200
    data = response.json()
    assert "critical_allergies" in data
    assert "privacy_notice" in data
