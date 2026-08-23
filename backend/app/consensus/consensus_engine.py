"""Multi-LLM Consensus Engine for HealthAssist."""

from typing import List, Dict, Any, Optional
from backend.app.ai.consensus import DeterministicConsensusEngine, consensus_engine
from backend.app.ai.schemas import ModelAssessmentOutput, ConsensusOutput, PatientCase


class ConsensusEngine:
    """Wrapper around the Deterministic Consensus Engine."""

    def __init__(self, required_agreement_threshold: float = 0.8):
        self.threshold = required_agreement_threshold
        self.engine = consensus_engine

    def compute_consensus(
        self,
        assessments: Dict[str, ModelAssessmentOutput],
        patient_case: Optional[PatientCase] = None,
    ) -> ConsensusOutput:
        """Computes deterministic multi-LLM consensus."""
        return self.engine.compute_consensus(assessments, patient_case)


__all__ = ["ConsensusEngine", "DeterministicConsensusEngine", "consensus_engine"]
