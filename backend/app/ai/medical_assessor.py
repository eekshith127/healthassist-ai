"""Multi-LLM Medical Assessor Engine.

Coordinates concurrent, independent differential clinical assessments across
multiple LLM models (Model A, Model B, Model C) from a normalized PatientCase.

Resilience guarantees:
- Concurrent asynchronous execution.
- Isolated failure handling: If one model fails, remaining models continue.
- Handles timeouts, rate limits, invalid JSON, provider failure, and missing responses.
- Secure backend persistence of raw model outputs.
- Never exposes API keys or credentials.
"""

import asyncio
import datetime
import json
import time
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session

from backend.app.schemas.intake import PatientCase
from backend.app.utils.config import settings
from backend.app.schemas.medical_assessment import (
    PossibleCondition,
    ModelAssessmentOutput,
    IndividualModelResult,
    ModelFailureRecord,
    MultiModelAssessmentResponse,
)
from backend.app.ai.model_config import (
    ModelConfig,
    MultiModelAssessmentConfig,
    get_default_model_configs,
    get_default_multi_model_config,
)
from backend.app.ai.provider_adapters import (
    BaseProviderAdapter,
    get_provider_adapter,
    ProviderException,
    ProviderTimeoutException,
    ProviderRateLimitException,
    ProviderInvalidJSONException,
    ProviderMissingResponseException,
)
from backend.app.models.model_assessment import ModelAssessment
from backend.app.utils.logger import logger


class MultiLLMMedicalAssessor:
    """Multi-LLM Medical Assessment Engine."""

    def __init__(
        self,
        config: Optional[MultiModelAssessmentConfig] = None,
        adapters: Optional[List[BaseProviderAdapter]] = None,
    ):
        self.config = config or get_default_multi_model_config()
        self._custom_adapters = adapters is not None
        self.adapters: List[BaseProviderAdapter] = (
            adapters
            if adapters is not None
            else [get_provider_adapter(model_cfg) for model_cfg in self.config.models]
        )

    def set_adapters(self, adapters: List[BaseProviderAdapter]) -> None:
        """Dynamically swap adapters at runtime."""
        self.adapters = adapters
        self._custom_adapters = True

    def normalize_patient_case(self, case_input: Union[PatientCase, Dict[str, Any]]) -> PatientCase:
        """Normalizes and validates the patient case ensuring identical schema input for all models."""
        if isinstance(case_input, PatientCase):
            patient_case = case_input
        elif isinstance(case_input, dict):
            patient_case = PatientCase.model_validate(case_input)
        else:
            raise ValueError(f"Invalid patient case input type: {type(case_input)}")

        # Ensure lists are cleanly initialized
        symptoms = [s.strip() for s in (patient_case.symptoms or []) if s and s.strip()]
        associated = [s.strip() for s in (patient_case.associated_symptoms or []) if s and s.strip()]
        red_flags = [s.strip() for s in (patient_case.red_flags or []) if s and s.strip()]

        return PatientCase(
            main_complaint=(patient_case.main_complaint or "").strip(),
            symptoms=symptoms,
            duration=(patient_case.duration or "").strip() or None,
            severity=patient_case.severity,
            onset=(patient_case.onset or "").strip(),
            associated_symptoms=associated,
            red_flags=red_flags,
        )

    async def _evaluate_single_model(
        self,
        adapter: BaseProviderAdapter,
        patient_case: PatientCase,
    ) -> IndividualModelResult:
        """Executes a single provider adapter with isolated error and latency tracking."""
        model_id = adapter.config.model_id
        model_name = adapter.config.model_name
        provider_name = adapter.config.provider
        start_time = time.perf_counter()

        try:
            # Enforce per-model timeout
            timeout_val = adapter.config.timeout_seconds
            output, raw_dict = await asyncio.wait_for(
                adapter.evaluate_case(patient_case),
                timeout=timeout_val,
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="success",
                assessment=output,
                raw_output=raw_dict,
                latency_ms=elapsed_ms,
            )

        except (asyncio.TimeoutError, ProviderTimeoutException) as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"[{model_id}] Assessment timed out after {elapsed_ms}ms: {e}")
            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="failed",
                error_type="timeout",
                error_message=f"Model request timed out after {elapsed_ms}ms",
                latency_ms=elapsed_ms,
            )

        except ProviderRateLimitException as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"[{model_id}] Rate limit error: {e}")
            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="failed",
                error_type="rate_limit",
                error_message="Provider rate limit exceeded (HTTP 429)",
                latency_ms=elapsed_ms,
            )

        except ProviderInvalidJSONException as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"[{model_id}] Invalid JSON returned: {e}")
            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="failed",
                error_type="invalid_json",
                error_message=f"Invalid JSON schema: {str(e)}",
                latency_ms=elapsed_ms,
            )

        except ProviderMissingResponseException as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"[{model_id}] Missing response: {e}")
            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="failed",
                error_type="missing_response",
                error_message="Provider returned an empty response",
                latency_ms=elapsed_ms,
            )

        except ProviderException as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"[{model_id}] Provider failure: {e}")
            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="failed",
                error_type=e.error_type,
                error_message=str(e),
                latency_ms=elapsed_ms,
            )

        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.exception(f"[{model_id}] Unexpected failure during medical assessment: {e}")
            return IndividualModelResult(
                model_id=model_id,
                model_name=model_name,
                provider=provider_name,
                status="failed",
                error_type="provider_error",
                error_message=f"Unexpected error: {type(e).__name__}",
                latency_ms=elapsed_ms,
            )

    async def assess_case(
        self,
        patient_case: Union[PatientCase, Dict[str, Any]],
        assessment_id: Optional[Union[int, str]] = None,
        db: Optional[Session] = None,
        save_to_db: bool = False,
    ) -> MultiModelAssessmentResponse:
        """Executes concurrent multi-model clinical assessments on a normalized patient case.
        
        Runs all models in parallel, handles partial failures, persists raw model outputs
        securely on the backend, and returns a consolidated response.
        """
        normalized_case = self.normalize_patient_case(patient_case)
        if getattr(self, "_custom_adapters", False):
            active_adapters = self.adapters
        elif getattr(settings, "MOCK_MODE", False):
            active_adapters = [get_provider_adapter(model_cfg) for model_cfg in get_default_model_configs()]
        else:
            active_adapters = self.adapters
        total_models = len(active_adapters)

        if total_models == 0:
            logger.warning("No model adapters configured for multi-model assessment.")
            return MultiModelAssessmentResponse(
                patient_case=normalized_case,
                assessments={},
                failures={},
                successful_models_count=0,
                total_models_count=0,
                status="failed",
                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            )

        # Launch all model adapters concurrently
        tasks = [
            self._evaluate_single_model(adapter, normalized_case)
            for adapter in active_adapters
        ]

        # Execute with overall timeout
        try:
            results: List[IndividualModelResult] = await asyncio.wait_for(
                asyncio.gather(*tasks),
                timeout=self.config.overall_timeout_seconds,
            )
        except asyncio.TimeoutError:
            logger.error(f"MultiModelAssessment overall timeout exceeded ({self.config.overall_timeout_seconds}s)")
            # In case of overall timeout, collect any completed or create timeout results
            results = [
                IndividualModelResult(
                    model_id=a.config.model_id,
                    model_name=a.config.model_name,
                    provider=a.config.provider,
                    status="failed",
                    error_type="timeout",
                    error_message="Overall multi-model assessment timeout exceeded",
                )
                for a in active_adapters
            ]

        # Collate successful assessments and failures
        assessments: Dict[str, ModelAssessmentOutput] = {}
        failures: Dict[str, ModelFailureRecord] = {}

        for res in results:
            if res.status == "success" and res.assessment is not None:
                assessments[res.model_id] = res.assessment

                # Persist raw model output in database if requested and db session provided
                if (save_to_db or assessment_id is not None) and db is not None:
                    try:
                        self._persist_model_assessment(
                            db=db,
                            assessment_id=assessment_id,
                            model_name=f"{res.model_id}:{res.model_name}",
                            raw_output=res.raw_output or res.assessment.model_dump(),
                            confidence=self._compute_average_assessment_score(res.assessment),
                        )
                    except Exception as e:
                        logger.error(f"Failed to persist ModelAssessment to db for {res.model_id}: {e}")

            else:
                failures[res.model_id] = ModelFailureRecord(
                    model_id=res.model_id,
                    model_name=res.model_name,
                    provider=res.provider,
                    error_type=res.error_type or "provider_error",
                    error_message=res.error_message or "Unknown failure",
                )

        successful_count = len(assessments)
        if successful_count == total_models:
            status = "completed"
        elif successful_count > 0:
            status = "partial_success"
        else:
            status = "failed"

        logger.info(
            f"Multi-LLM assessment completed: {successful_count}/{total_models} models succeeded. "
            f"Status: {status}."
        )

        return MultiModelAssessmentResponse(
            patient_case=normalized_case,
            assessments=assessments,
            failures=failures,
            successful_models_count=successful_count,
            total_models_count=total_models,
            status=status,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )

    def _compute_average_assessment_score(self, assessment: ModelAssessmentOutput) -> Optional[float]:
        """Calculates the average condition assessment relevance score."""
        if not assessment.possible_conditions:
            return None
        scores = [c.assessment_score for c in assessment.possible_conditions]
        return round(float(sum(scores)) / len(scores), 2)

    def _persist_model_assessment(
        self,
        db: Session,
        assessment_id: Optional[Union[int, str]],
        model_name: str,
        raw_output: Dict[str, Any],
        confidence: Optional[float] = None,
    ) -> None:
        """Stores raw model output securely in the database model_assessments table."""
        if not assessment_id:
            return

        try:
            int_assessment_id = int(assessment_id)
        except (ValueError, TypeError):
            # Non-integer assessment ID (e.g. UUID string)
            return

        record = ModelAssessment(
            assessment_id=int_assessment_id,
            model_name=model_name,
            result=json.dumps(raw_output),
            confidence=confidence,
        )
        db.add(record)
        db.commit()


# Default singleton instance
medical_assessor = MultiLLMMedicalAssessor()


async def assess_patient_case(
    patient_case: Union[PatientCase, Dict[str, Any]],
    assessment_id: Optional[Union[int, str]] = None,
    db: Optional[Session] = None,
    save_to_db: bool = False,
) -> MultiModelAssessmentResponse:
    """Convenience helper to assess a patient case using the default multi-LLM assessor."""
    return await medical_assessor.assess_case(
        patient_case=patient_case,
        assessment_id=assessment_id,
        db=db,
        save_to_db=save_to_db,
    )
