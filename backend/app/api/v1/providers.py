from fastapi import APIRouter

router = APIRouter(prefix="/providers", tags=["Providers"])


@router.get("/")
def list_providers_placeholder():
    return {
        "providers": [
            {
                "id": 1,
                "name": "Dr. Sarah Jenkins",
                "specialty": "General Physician & Tele-Triage",
                "availability": "Available Today",
                "rating": 4.9,
            },
            {
                "id": 2,
                "name": "Dr. Marcus Chen",
                "specialty": "Cardiology Specialist",
                "availability": "Tomorrow 10:00 AM",
                "rating": 4.8,
            },
        ]
    }
