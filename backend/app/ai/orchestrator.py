"""Multi-LLM AI Assessment Pipeline Orchestrator for HealthAssist.

Implements the complete end-to-end clinical workflow:
User → Gemini Intake AI → PatientCase → Three Independent Assessments (NVIDIA, Ollama, Model 3)
→ Deterministic Consensus Engine → AI Judge → Safety Engine → Final Assessment → Healthcare Provider Referral.
"""

import json
from typing import Dict, Optional, Any, Union
from sqlalchemy.orm import Session

from backend.app.ai.schemas import (
    PatientCase,
    ModelAssessmentOutput,
    ConsensusOutput,
    JudgeOutput,
    SafetyOutput,
    FinalAssessmentOutput,
)
from backend.app.ai.intake import intake_ai
from backend.app.ai.assessor import three_model_assessor
from backend.app.ai.consensus import consensus_engine
from backend.app.ai.judge import ai_judge
from backend.app.ai.safety import safety_engine
from backend.app.models.model_assessment import ModelAssessment
from backend.app.models.consensus_result import ConsensusResult
from backend.app.models.final_assessment import FinalAssessment
from backend.app.models.assessment import Assessment
from backend.app.utils.logger import logger


class MultiLLMOrchestrator:
    """Full pipeline coordinator for HealthAssist Multi-LLM AI Assessment."""

    async def execute_pipeline(
        self,
        patient_case: PatientCase,
        assessment_id: Optional[Union[int, str]] = None,
        db: Optional[Session] = None,
        mock_scenario: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> FinalAssessmentOutput:
        """Executes the complete HealthAssist Multi-LLM AI Assessment Pipeline."""
        logger.info(f"Starting Multi-LLM Assessment Pipeline for assessment #{assessment_id}...")

        # STEP 5 & 6: Run 3 Independent Concurrent AI Assessments
        assessments: Dict[str, ModelAssessmentOutput] = await three_model_assessor.run_three_assessments(
            patient_case=patient_case,
            mock_scenario=mock_scenario,
        )

        # STEP 7: Deterministic Consensus Engine (Python)
        consensus: ConsensusOutput = consensus_engine.compute_consensus(
            assessments=assessments,
            patient_case=patient_case,
        )

        # STEP 8: AI Judge Synthesis
        judge: JudgeOutput = await ai_judge.evaluate_consensus(
            patient_case=patient_case,
            assessments=assessments,
            consensus=consensus,
        )

        # STEP 9: Independent Deterministic Safety Engine
        safety: SafetyOutput = safety_engine.evaluate(patient_case)

        # Combine unique conditions across all models
        all_possible_conditions = []
        for a in assessments.values():
            for c in a.possible_conditions:
                if c.name not in all_possible_conditions:
                    all_possible_conditions.append(c.name)
        if not all_possible_conditions:
            all_possible_conditions.append(consensus.leading_condition)

        # Compile all red flags
        all_red_flags = list(set(safety.red_flags + [rf for a in assessments.values() for rf in a.red_flags]))

        # STEP 10: Final Consolidated Assessment
        # Enforce Safety Engine Priority: If safety_override is active, it overrides general advice
        if safety.safety_override:
            effective_severity = "EMERGENCY"
            effective_next_step = safety.recommended_action
            effective_specialty = "Emergency Medicine / ER"
            effective_explanation = f"CRITICAL SAFETY OVERRIDE ACTIVATED: {safety.recommended_action}"
        else:
            effective_severity = safety.severity
            effective_next_step = judge.recommended_next_step
            effective_specialty = judge.recommended_specialty
            effective_explanation = judge.synthesized_summary

        final_result = FinalAssessmentOutput(
            possible_conditions=all_possible_conditions,
            leading_condition=consensus.leading_condition,
            consensus_score=consensus.consensus_score,
            model_agreement=consensus.model_agreement,
            agreement_level=consensus.agreement_level,
            severity=effective_severity,
            red_flags=all_red_flags,
            recommended_specialty=effective_specialty,
            explanation=effective_explanation,
            recommended_next_step=effective_next_step,
            safety_override=safety.safety_override,
            safety_action=safety.recommended_action if safety.safety_override else None,
            disagreements=consensus.disagreements,
            models_available=consensus.models_available,
            model_assessments=assessments,
        )

        # STEP 17: Secure Backend Persistence to Database
        if db is not None and assessment_id is not None:
            self._persist_to_database(
                db=db,
                assessment_id=assessment_id,
                assessments=assessments,
                consensus=consensus,
                final_result=final_result,
            )

        logger.info(
            f"Multi-LLM Pipeline complete for #{assessment_id}: leading='{final_result.leading_condition}', "
            f"score={final_result.consensus_score}, agreement={final_result.model_agreement}, "
            f"safety_override={final_result.safety_override}"
        )

        return final_result

    def _persist_to_database(
        self,
        db: Session,
        assessment_id: Union[int, str],
        assessments: Dict[str, ModelAssessmentOutput],
        consensus: ConsensusOutput,
        final_result: FinalAssessmentOutput,
    ) -> None:
        """Stores assessment, models, consensus, and final result in database tables securely."""
        try:
            int_id = int(assessment_id)
        except (ValueError, TypeError):
            return

        try:
            # 1. Update main Assessment record
            assessment_record = db.query(Assessment).filter(Assessment.id == int_id).first()
            if assessment_record:
                assessment_record.ai_summary = final_result.explanation
                assessment_record.consensus_score = float(final_result.consensus_score)
                assessment_record.triage_level = (
                    "emergency" if final_result.safety_override
                    else final_result.severity.lower()
                )
                assessment_record.recommended_specialist = final_result.recommended_specialty
                assessment_record.safety_checked = "overridden" if final_result.safety_override else "passed"

            # 2. Persist individual ModelAssessment records
            for m_id, m_output in assessments.items():
                db_model_rec = ModelAssessment(
                    assessment_id=int_id,
                    model_name=m_id,
                    result=json.dumps(m_output.model_dump()),
                    confidence=float(m_output.possible_conditions[0].score) if m_output.possible_conditions else None,
                )
                db.add(db_model_rec)

            # 3. Persist ConsensusResult record
            existing_consensus = db.query(ConsensusResult).filter(ConsensusResult.assessment_id == int_id).first()
            if existing_consensus:
                existing_consensus.result = json.dumps(consensus.model_dump())
                existing_consensus.score = float(consensus.consensus_score)
            else:
                db.add(
                    ConsensusResult(
                        assessment_id=int_id,
                        result=json.dumps(consensus.model_dump()),
                        score=float(consensus.consensus_score),
                    )
                )

            # 4. Persist FinalAssessment record
            existing_final = db.query(FinalAssessment).filter(FinalAssessment.assessment_id == int_id).first()
            if existing_final:
                existing_final.summary = final_result.explanation
                existing_final.recommendations = json.dumps({
                    "recommended_specialty": final_result.recommended_specialty,
                    "recommended_next_step": final_result.recommended_next_step,
                    "safety_override": final_result.safety_override,
                    "model_agreement": final_result.model_agreement,
                })
            else:
                db.add(
                    FinalAssessment(
                        assessment_id=int_id,
                        summary=final_result.explanation,
                        recommendations=json.dumps({
                            "recommended_specialty": final_result.recommended_specialty,
                            "recommended_next_step": final_result.recommended_next_step,
                            "safety_override": final_result.safety_override,
                            "model_agreement": final_result.model_agreement,
                        }),
                    )
                )

            db.commit()
            logger.info(f"Successfully persisted complete Multi-LLM records for Assessment #{int_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting Multi-LLM records to database: {e}")


# Global singleton orchestrator
orchestrator = MultiLLMOrchestrator()
