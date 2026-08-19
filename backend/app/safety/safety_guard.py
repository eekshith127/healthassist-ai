"""Safety Assessment & Clinical Red-Flag Guard (Placeholder/Stub).

Scans inputs and outputs for emergency symptoms, drug interactions, or
dangerous advice.
"""

from typing import Dict, Any, List

EMERGENCY_KEYWORDS = [
    "chest pain",
    "difficulty breathing",
    "stroke",
    "severe bleeding",
    "unconscious",
    "sudden numbness",
    "anaphylaxis",
]


class SafetyGuard:
    """Clinical safety validation guard."""

    def __init__(self, emergency_keywords: List[str] = None):
        self.emergency_keywords = emergency_keywords or EMERGENCY_KEYWORDS

    def check_for_red_flags(self, text: str) -> Dict[str, Any]:
        """Perform basic keyword-based safety screening."""
        lower_text = text.lower()
        flagged = [kw for kw in self.emergency_keywords if kw in lower_text]
        return {
            "is_emergency": len(flagged) > 0,
            "flagged_keywords": flagged,
            "action_required": "EMERGENCY_CALL_911"
            if flagged
            else "CONTINUE_STANDARD_ASSESSMENT",
        }
