"""Ollama LLM Provider Implementation for HealthAssist.

Serves as Independent Assessment Model #2 (Ollama local/remote runtime).
"""

from typing import Optional, Type, TypeVar, Dict, Any
import httpx
from pydantic import BaseModel

from backend.app.ai.base import (
    BaseLLMProvider,
    LLMProviderException,
    LLMTimeoutException,
    LLMUnavailableException,
    extract_and_parse_json,
)
from backend.app.utils.config import settings
from backend.app.utils.logger import logger

T = TypeVar("T", bound=BaseModel)


class OllamaProvider(BaseLLMProvider):
    """Provider adapter for Ollama runtime via REST API."""

    def __init__(
        self,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: float = 30.0,
    ):
        model = model_name or settings.OLLAMA_MODEL or "llama3.2"
        url = base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434"
        key = api_key or settings.OLLAMA_API_KEY
        super().__init__(
            model_name=model,
            api_key=key,
            base_url=url.rstrip("/"),
            timeout_seconds=timeout_seconds,
        )

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        url = f"{self.base_url}/api/chat"
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        timeout = httpx.Timeout(self.timeout_seconds)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                return data.get("message", {}).get("content", "")
        except httpx.ConnectError:
            raise LLMUnavailableException(
                f"Ollama server is offline or unreachable at {self.base_url}",
                provider="ollama",
            )
        except httpx.TimeoutException:
            raise LLMTimeoutException(
                f"Ollama request timed out after {self.timeout_seconds}s",
                provider="ollama",
            )
        except (LLMTimeoutException, LLMUnavailableException, LLMProviderException):
            raise
        except Exception as e:
            raise LLMProviderException(f"Ollama generation failure: {str(e)}", provider="ollama")

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> T:
        url = f"{self.base_url}/api/chat"
        messages = []
        structured_sys = (
            f"{system_instruction or ''}\n\n"
            "STRICT CLINICAL JSON CONSTRAINT: Respond ONLY with a valid JSON object matching the requested schema. "
            "Do NOT include markdown formatting or commentary."
        )
        messages.append({"role": "system", "content": structured_sys})
        messages.append({"role": "user", "content": prompt})

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        timeout = httpx.Timeout(self.timeout_seconds)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                raw_text = data.get("message", {}).get("content", "")
                return extract_and_parse_json(raw_text, schema=schema)
        except httpx.ConnectError:
            raise LLMUnavailableException(
                f"Ollama server is offline or unreachable at {self.base_url}",
                provider="ollama",
            )
        except httpx.TimeoutException:
            raise LLMTimeoutException(
                f"Ollama structured request timed out after {self.timeout_seconds}s",
                provider="ollama",
            )
        except (LLMTimeoutException, LLMUnavailableException, LLMProviderException):
            raise
        except Exception as e:
            raise LLMProviderException(f"Ollama structured generation failure: {str(e)}", provider="ollama")
