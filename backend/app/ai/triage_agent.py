"""AI Conversational Triage Agent (Placeholder/Stub).

Responsible for processing user symptoms and formulating initial clinical
guidance.
"""

from typing import Dict, Any, Optional


class TriageAgent:
    """Conversational AI triage engine."""

    def __init__(self, model_name: str = "default-triage-model"):
        self.model_name = model_name

    async def evaluate_symptoms(
        self,
        symptoms: str,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Placeholder evaluation.

        Real LLM orchestration will be integrated in future phases.
        """
        return {
            "symptoms_analyzed": symptoms,
            "status": "ready_for_orchestration",
            "mock_triage_level": "non-urgent",
            "message": "AI Triage engine placeholder initialized successfully.",
        }
