"""Deterministic Consensus Engine for HealthAssist Multi-LLM Orchestration.

Calculates exact clinical model voting, condition matching, agreement ratio,
disagreement detection, and the deterministic AI Consensus Score in pure Python.
DOES NOT USE AN LLM TO VOTE.
"""

import re
from typing import Dict, List, Optional, Tuple, Any
from backend.app.ai.schemas import (
    ModelAssessmentOutput,
    ConsensusOutput,
    PatientCase,
    PossibleCondition,
)
from backend.app.utils.logger import logger


# Clinical synonym dictionary for normalizing medical condition terminology
CLINICAL_SYNONYM_MAP: Dict[str, str] = {
    # Headaches
    "migraine": "Migraine",
    "migraine headache": "Migraine",
    "migraine without aura": "Migraine",
    "migraine with aura": "Migraine with Aura",
    "acute migraine": "Migraine",
    "tension headache": "Tension-Type Headache",
    "tension-type headache": "Tension-Type Headache",
    "tension cephalea": "Tension-Type Headache",
    "primary tension cephalea": "Tension-Type Headache",
    "cluster headache": "Cluster Headache",
    "sinus headache": "Sinusitis / Sinus Headache",
    "sinusitis": "Sinusitis / Sinus Headache",
    "acute sinusitis": "Sinusitis / Sinus Headache",

    # Respiratory & Infectious
    "viral uri": "Viral Upper Respiratory Tract Infection",
    "upper respiratory tract infection": "Viral Upper Respiratory Tract Infection",
    "upper respiratory infection": "Viral Upper Respiratory Tract Infection",
    "viral upper respiratory infection": "Viral Upper Respiratory Tract Infection",
    "common cold": "Viral Upper Respiratory Tract Infection",
    "acute bronchitis": "Acute Bronchitis",
    "viral bronchitis": "Acute Bronchitis",
    "bronchitis": "Acute Bronchitis",
    "pharyngitis": "Viral Pharyngitis",
    "viral pharyngitis": "Viral Pharyngitis",
    "sore throat": "Viral Pharyngitis",
    "strep throat": "Streptococcal Pharyngitis",
    "streptococcal pharyngitis": "Streptococcal Pharyngitis",
    "pneumonia": "Community-Acquired Pneumonia",
    "community-acquired pneumonia": "Community-Acquired Pneumonia",
    "allergic rhinitis": "Allergic Rhinitis",
    "allergic rhinitis with post-nasal drip": "Allergic Rhinitis",
    "influenza": "Influenza (Flu)",
    "flu": "Influenza (Flu)",
    "covid-19": "COVID-19 Acute Viral Syndrome",

    # Cardiovascular / Chest
    "acute coronary syndrome": "Acute Coronary Syndrome Rule-Out",
    "acute coronary syndrome (acs) rule-out": "Acute Coronary Syndrome Rule-Out",
    "myocardial infarction": "Acute Coronary Syndrome Rule-Out",
    "angina": "Angina Pectoris",
    "musculoskeletal chest pain": "Musculoskeletal Chest Wall Pain",
    "costochondritis": "Musculoskeletal Chest Wall Pain",
    "atypical chest discomfort": "Musculoskeletal Chest Wall Pain",
    "gerd": "Gastroesophageal Reflux Disease (GERD)",
    "gastroesophageal reflux disease": "Gastroesophageal Reflux Disease (GERD)",
    "acid reflux": "Gastroesophageal Reflux Disease (GERD)",

    # GI
    "gastroenteritis": "Acute Viral Gastroenteritis",
    "viral gastroenteritis": "Acute Viral Gastroenteritis",
    "acute viral gastroenteritis": "Acute Viral Gastroenteritis",
    "stomach flu": "Acute Viral Gastroenteritis",
    "food poisoning": "Foodborne Acute Gastroenteritis",
    "gastritis": "Functional Dyspepsia / Gastritis",
    "functional dyspepsia": "Functional Dyspepsia / Gastritis",
    "irritable bowel syndrome": "Irritable Bowel Syndrome (IBS)",
    "ibs": "Irritable Bowel Syndrome (IBS)",

    # Musculoskeletal
    "lumbar muscle strain": "Acute Lumbar Muscular Strain",
    "acute lumbar strain": "Acute Lumbar Muscular Strain",
    "lower back pain": "Acute Lumbar Muscular Strain",
    "sciatica": "Lumbar Radiculopathy (Sciatica)",
}


def normalize_condition_name(raw_name: str) -> str:
    """Standardizes condition names using canonicalization rules and clinical synonym dictionary."""
    if not raw_name:
        return "Unspecified Condition"

    cleaned = raw_name.strip().lower()
    # Remove leading numbering or bullets e.g. "1. Migraine" -> "migraine"
    cleaned = re.sub(r"^\d+[\.\)]\s*", "", cleaned)
    # Remove parenthetical abbreviations e.g. "migraine (acute)" -> "migraine"
    base_cleaned = re.sub(r"\(.*?\)", "", cleaned).strip()

    # Check direct match in synonym map
    if cleaned in CLINICAL_SYNONYM_MAP:
        return CLINICAL_SYNONYM_MAP[cleaned]
    if base_cleaned in CLINICAL_SYNONYM_MAP:
        return CLINICAL_SYNONYM_MAP[base_cleaned]

    # Partial substring matches for standard clusters
    for syn_key, canonical in CLINICAL_SYNONYM_MAP.items():
        if syn_key in cleaned or syn_key in base_cleaned:
            return canonical

    # If no mapping, return nicely title-cased string
    return raw_name.strip().title()


class DeterministicConsensusEngine:
    """Pure Python Deterministic Consensus Engine."""

    def compute_consensus(
        self,
        assessments: Dict[str, ModelAssessmentOutput],
        patient_case: Optional[PatientCase] = None,
    ) -> ConsensusOutput:
        """Calculates multi-model consensus, voting ratio, and deterministic AI Consensus Score."""
        models_available = len(assessments)
        if models_available == 0:
            return ConsensusOutput(
                leading_condition="Undetermined (No Models Available)",
                model_agreement="0/0",
                consensus_score=0,
                agreement_level="low",
                disagreements=["No model assessments were available to compute consensus."],
                models_available=0,
                condition_votes={},
            )

        # 1. Collect and normalize all conditions per model
        # Map: canonical_name -> list of (model_id, condition_score, raw_condition_name)
        condition_map: Dict[str, List[Tuple[str, int, str]]] = {}
        model_top_picks: Dict[str, Tuple[str, int]] = {}

        for model_id, model_output in assessments.items():
            if not model_output.possible_conditions:
                continue

            # Identify top pick for this model
            sorted_conditions = sorted(
                model_output.possible_conditions,
                key=lambda c: c.score,
                reverse=True,
            )
            top_cond = sorted_conditions[0]
            canonical_top = normalize_condition_name(top_cond.name)
            model_top_picks[model_id] = (canonical_top, top_cond.score)

            # Record all evaluated conditions for this model
            for cond in model_output.possible_conditions:
                canonical = normalize_condition_name(cond.name)
                if canonical not in condition_map:
                    condition_map[canonical] = []
                condition_map[canonical].append((model_id, cond.score, cond.name))

        if not condition_map:
            return ConsensusOutput(
                leading_condition="Undetermined Condition",
                model_agreement=f"0/{models_available}",
                consensus_score=30,
                agreement_level="low",
                disagreements=["Models returned empty condition lists."],
                models_available=models_available,
                condition_votes={},
            )

        # 2. Count votes based on models that included the condition (weighted by top picks)
        # We compute votes: count of distinct models that included the canonical condition
        condition_votes: Dict[str, int] = {}
        for canonical, occurrences in condition_map.items():
            unique_models = set(occ[0] for occ in occurrences)
            condition_votes[canonical] = len(unique_models)

        # Rank conditions by vote count, then by average assessment score
        def get_rank_tuple(canonical: str) -> Tuple[int, float]:
            votes = condition_votes[canonical]
            scores = [occ[1] for occ in condition_map[canonical]]
            avg_score = sum(scores) / len(scores) if scores else 0.0
            return (votes, avg_score)

        sorted_conditions = sorted(
            condition_votes.keys(),
            key=lambda c: get_rank_tuple(c),
            reverse=True,
        )

        leading_condition = sorted_conditions[0]
        leading_votes = condition_votes[leading_condition]
        leading_scores = [occ[1] for occ in condition_map[leading_condition]]
        avg_leading_score = sum(leading_scores) / len(leading_scores) if leading_scores else 70.0

        agreement_ratio = leading_votes / models_available
        model_agreement_str = f"{leading_votes}/{models_available}"

        # 3. Calculate Deterministic AI Consensus Score (0-100)
        # Scaled by agreement ratio and average model weight
        if models_available >= 3:
            if leading_votes == 3:  # 3/3 unanimous
                agreement_level = "high"
                # Bonus for unanimous agreement, bounded at 98
                consensus_score = min(98, round(avg_leading_score * 1.05))
            elif leading_votes == 2:  # 2/3 majority
                agreement_level = "moderate"
                consensus_score = min(88, max(50, round(avg_leading_score * 0.90)))
            else:  # 1/3 split disagreement
                agreement_level = "low"
                consensus_score = min(60, max(25, round(avg_leading_score * 0.60)))
        elif models_available == 2:
            if leading_votes == 2:  # 2/2 agreement
                agreement_level = "high"
                consensus_score = min(95, round(avg_leading_score * 1.0))
            else:  # 1/2 split
                agreement_level = "moderate"
                consensus_score = min(68, max(35, round(avg_leading_score * 0.70)))
        else:  # 1 model available
            agreement_level = "moderate"
            consensus_score = min(80, round(avg_leading_score * 0.85))

        # 4. Detect and report explicit disagreements
        disagreements: List[str] = []
        for model_id, (top_pick, score) in model_top_picks.items():
            if top_pick != leading_condition:
                model_label = model_id.replace("_", " ").title()
                disagreements.append(
                    f"{model_label} suggested '{top_pick}' (score: {score}/100) as primary possibility."
                )

        if models_available < 3:
            disagreements.append(
                f"Note: Consensus calculated with {models_available}/3 models available."
            )

        logger.info(
            f"Consensus computed: leading='{leading_condition}' ({model_agreement_str}), "
            f"score={consensus_score}, level={agreement_level}, disagreements={len(disagreements)}"
        )

        return ConsensusOutput(
            leading_condition=leading_condition,
            model_agreement=model_agreement_str,
            consensus_score=consensus_score,
            agreement_level=agreement_level,
            disagreements=disagreements,
            models_available=models_available,
            condition_votes=condition_votes,
        )


# Global singleton consensus engine
consensus_engine = DeterministicConsensusEngine()
