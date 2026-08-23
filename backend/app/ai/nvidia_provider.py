"""NVIDIA LLM Provider Implementation for HealthAssist.

Serves as:
1. Independent Assessment Model #1 (e.g. meta/llama-3.3-70b-instruct)
2. Third Assessment Model (e.g. nvidia/nemotron-3-nano-omni-30b-a3b-reasoning)
3. AI Judge Reasoning Provider
"""

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


class NVIDIAProvider(BaseLLMProvider):
    """Provider adapter for NVIDIA NIM API (OpenAI-compatible /chat/completions)."""

    def __init__(
        self,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: float = 45.0,
    ):
        model = model_name or settings.NVIDIA_MODEL or "meta/llama-3.3-70b-instruct"
        key = api_key or settings.NVIDIA_API_KEY
        url = base_url or settings.NVIDIA_BASE_URL or "https://integrate.api.nvidia.com/v1"
        super().__init__(
            model_name=model,
            api_key=key,
            base_url=f"{url.rstrip('/')}/chat/completions" if not url.endswith("/chat/completions") else url,
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
            raise LLMProviderException("NVIDIA_API_KEY is not configured", provider="nvidia")

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        timeout = httpx.Timeout(self.timeout_seconds)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(self.base_url, json=payload, headers=headers)
                if resp.status_code == 429:
                    raise LLMRateLimitException("NVIDIA rate limit exceeded (429)", provider="nvidia")
                resp.raise_for_status()
                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise LLMProviderException("NVIDIA returned empty choices", provider="nvidia")
                return choices[0].get("message", {}).get("content", "")
        except httpx.TimeoutException:
            raise LLMTimeoutException(f"NVIDIA request timed out after {self.timeout_seconds}s", provider="nvidia")
        except (LLMTimeoutException, LLMRateLimitException, LLMProviderException):
            raise
        except Exception as e:
            raise LLMProviderException(f"NVIDIA generation failure: {str(e)}", provider="nvidia")

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2500,
    ) -> T:
        if not self.api_key:
            raise LLMProviderException("NVIDIA_API_KEY is not configured", provider="nvidia")

        messages = []
        structured_sys = (
            f"{system_instruction or ''}\n\n"
            "STRICT CLINICAL JSON CONSTRAINT: You MUST respond ONLY with a single valid JSON object strictly "
            "matching the requested schema without markdown codeblocks, preambles, or conversational notes."
        )
        messages.append({"role": "system", "content": structured_sys})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }

        timeout = httpx.Timeout(self.timeout_seconds)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(self.base_url, json=payload, headers=headers)
                if resp.status_code == 429:
                    raise LLMRateLimitException("NVIDIA rate limit exceeded (429)", provider="nvidia")
                resp.raise_for_status()
                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise LLMProviderException("NVIDIA returned empty choices", provider="nvidia")
                raw_text = choices[0].get("message", {}).get("content", "")
                return extract_and_parse_json(raw_text, schema=schema)
        except httpx.TimeoutException:
            raise LLMTimeoutException(f"NVIDIA structured request timed out after {self.timeout_seconds}s", provider="nvidia")
        except (LLMTimeoutException, LLMRateLimitException, LLMProviderException):
            raise
        except Exception as e:
            raise LLMProviderException(f"NVIDIA structured generation failure: {str(e)}", provider="nvidia")
