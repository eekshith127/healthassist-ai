"""Google Gemini LLM Provider Implementation for HealthAssist.

Primarily serves as the Conversational Intake AI and auxiliary reasoning provider.
"""

import asyncio
from typing import Optional, Type, TypeVar, Dict, Any
import httpx
from pydantic import BaseModel

from backend.app.ai.base import (
    BaseLLMProvider,
    LLMProviderException,
    LLMTimeoutException,
    LLMRateLimitException,
    extract_and_parse_json,
)
from backend.app.utils.config import settings
from backend.app.utils.logger import logger

T = TypeVar("T", bound=BaseModel)


class GeminiProvider(BaseLLMProvider):
    """Provider adapter for Google Gemini models via REST API."""

    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: float = 25.0,
    ):
        model = model_name or settings.GEMINI_MODEL or "gemini-2.5-flash"
        key = api_key or settings.GEMINI_API_KEY
        super().__init__(
            model_name=model,
            api_key=key,
            base_url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            timeout_seconds=timeout_seconds,
        )

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        if not self.api_key:
            raise LLMProviderException("GEMINI_API_KEY is not configured", provider="gemini")

        url = f"{self.base_url}?key={self.api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        timeout = httpx.Timeout(self.timeout_seconds)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 429:
                    raise LLMRateLimitException("Gemini API rate limit exceeded (429)", provider="gemini")
                resp.raise_for_status()
                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    raise LLMProviderException("Gemini returned empty candidate list", provider="gemini")
                return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        except httpx.TimeoutException:
            raise LLMTimeoutException(f"Gemini request timed out after {self.timeout_seconds}s", provider="gemini")
        except (LLMTimeoutException, LLMRateLimitException, LLMProviderException):
            raise
        except Exception as e:
            raise LLMProviderException(f"Gemini generation failure: {str(e)}", provider="gemini")

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2500,
    ) -> T:
        if not self.api_key:
            raise LLMProviderException("GEMINI_API_KEY is not configured", provider="gemini")

        url = f"{self.base_url}?key={self.api_key}"
        json_sys_instruction = (
            f"{system_instruction or ''}\n\n"
            "STRICT INSTRUCTION: Respond ONLY with valid, unadorned JSON conforming to the requested schema. "
            "Do NOT include markdown formatting, backticks, or preamble."
        )

        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": json_sys_instruction}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        timeout = httpx.Timeout(self.timeout_seconds)
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 429:
                        if attempt < max_attempts:
                            wait_time = attempt * 2.0
                            logger.warning(f"Gemini 429 rate limit hit. Retrying in {wait_time}s (attempt {attempt}/{max_attempts})...")
                            await asyncio.sleep(wait_time)
                            continue
                        raise LLMRateLimitException("Gemini API rate limit exceeded (429)", provider="gemini")
                    resp.raise_for_status()
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise LLMProviderException("Gemini returned empty candidates", provider="gemini")
                    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return extract_and_parse_json(raw_text, schema=schema)
            except httpx.TimeoutException:
                raise LLMTimeoutException(f"Gemini structured request timed out after {self.timeout_seconds}s", provider="gemini")
            except (LLMTimeoutException, LLMRateLimitException, LLMProviderException):
                raise
            except Exception as e:
                raise LLMProviderException(f"Gemini structured generation failure: {str(e)}", provider="gemini")
