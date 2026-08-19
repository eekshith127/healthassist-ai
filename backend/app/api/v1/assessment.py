from fastapi import APIRouter

router = APIRouter(prefix="/assessment", tags=["Assessment"])


@router.post("/evaluate")
def evaluate_symptoms_placeholder():
    return {
        "status": "ready",
        "message": "AI symptom assessment placeholder endpoint.",
    }
