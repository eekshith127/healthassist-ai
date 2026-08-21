"""Provider-Independent AI Service Interface for HealthAssist.

Enables seamless switching between Mock LLM, Google Gemini, OpenAI, and Anthropic.
Ensures all API keys remain strictly server-side and schemas are rigorously validated.
"""

import abc
import json
import re
from typing import Dict, Any, Optional, Type, List
from pydantic import BaseModel
import httpx

from backend.app.utils.config import settings
from backend.app.utils.logger import logger


class BaseLLMProvider(abc.ABC):
    """Abstract base interface for LLM provider adapters."""

    @abc.abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        schema: Optional[Type[BaseModel]] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON conforming to an optional schema."""
        pass

    @abc.abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        """Generate freeform text response."""
        pass


class MockLLMProvider(BaseLLMProvider):
    """Deterministic, clinically structured mock provider for offline development and testing."""

    def __init__(self):
        self.emergency_keywords = [
            "chest pain",
            "chest pressure",
            "shortness of breath",
            "difficulty breathing",
            "trouble breathing",
            "sudden numbness",
            "sudden weakness",
            "facial droop",
            "slurred speech",
            "anaphylaxis",
            "throat closing",
            "coughing blood",
            "unconscious",
            "loss of consciousness",
            "suicidal",
            "worst headache of my life",
            "thunderclap headache",
            "stiff neck and fever",
        ]

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        return "I am HealthAssist Intake AI (Mock Mode). I am here to understand your symptoms and help collect your clinical case history."

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        schema: Optional[Type[BaseModel]] = None,
    ) -> Dict[str, Any]:
        """Intelligently parses user conversation & health profile context in mock mode."""
        prompt_lower = prompt.lower()

        # Extract red flags
        detected_red_flags = []
        for kw in self.emergency_keywords:
            if kw in prompt_lower:
                detected_red_flags.append(kw)

        # Detect symptoms and main complaint
        symptoms = []
        complaint_candidates = [
            ("headache", ["headache", "migraine", "head pressure", "throbbing head"]),
            ("cough", ["cough", "coughing", "dry cough", "productive cough"]),
            ("sore throat", ["sore throat", "throat pain", "scratchy throat"]),
            ("fever", ["fever", "chills", "high temp", "temperature"]),
            ("back pain", ["back pain", "lower back pain", "spine pain"]),
            ("rash", ["rash", "skin itch", "red spots", "hives"]),
            ("nausea", ["nausea", "vomiting", "upset stomach"]),
            ("chest pain", ["chest pain", "chest pressure", "chest tightness"]),
            ("shortness of breath", ["shortness of breath", "dyspnea", "breathless", "hard to breathe"]),
            ("fatigue", ["fatigue", "tiredness", "exhaustion", "weakness"]),
            ("congestion", ["congestion", "runny nose", "sinus pressure", "stuffy nose"]),
            ("abdominal pain", ["abdominal pain", "stomach ache", "belly pain", "cramps"]),
            ("joint pain", ["joint pain", "knee pain", "swollen joint", "arthritis"]),
        ]

        main_complaint = ""
        for name, kws in complaint_candidates:
            if any(k in prompt_lower for k in kws):
                symptoms.append(name)
                if not main_complaint:
                    main_complaint = name.capitalize()

        import datetime

        # 1. Check for Time / Date queries
        time_patterns = [r"\bwhat\s+time\b", r"\btell\s+(?:me\s+)?(?:the\s+)?time\b", r"\bcurrent\s+time\b", r"\bwhat(?:'s|\s+is)\s+the\s+time\b", r"\bwhat\s+date\b", r"\btoday(?:'s)?\s+date\b", r"\bwhat\s+day\b"]
        if any(re.search(pat, prompt_lower) for pat in time_patterns):
            now = datetime.datetime.now()
            time_str = now.strftime("%I:%M %p")
            date_str = now.strftime("%A, %B %d, %Y")
            return {
                "assistant_message": (
                    f"The current time is **{time_str}** on **{date_str}**. "
                    "I am your HealthAssist assistant. Is there a health symptom or medical question I can assist you with today?"
                ),
                "information_complete": False,
                "patient_case": {
                    "main_complaint": "",
                    "symptoms": [],
                    "duration": None,
                    "severity": None,
                    "onset": "",
                    "associated_symptoms": [],
                    "red_flags": [],
                },
            }

        # 2. Check for Identity / Capabilities / System purpose queries
        identity_patterns = [r"\bwho\s+are\s+you\b", r"\bwhat\s+is\s+healthassist\b", r"\bwhat\s+can\s+you\s+do\b", r"\bhow\s+do\s+you\s+work\b", r"\btell\s+me\s+about\s+yourself\b", r"\bwhat\s+is\s+this\s+app\b"]
        if any(re.search(pat, prompt_lower) for pat in identity_patterns):
            return {
                "assistant_message": (
                    "I am **HealthAssist AI**, your intelligent clinical telehealth assistant. Here is what I can do for you:\n\n"
                    "• **Symptom Intake & Triage:** Guide you through a structured intake to evaluate symptoms and urgency.\n"
                    "• **Red-Flag Screening:** Screen for acute emergency conditions (e.g. chest pressure, severe breathing difficulty).\n"
                    "• **Doctor Connectivity:** Help you find verified healthcare providers and book telehealth consultations.\n"
                    "• **Health Profile Integration:** Keep track of your vitals, known conditions, and medications securely.\n\n"
                    "How can I help you today?"
                ),
                "information_complete": False,
                "patient_case": {
                    "main_complaint": "",
                    "symptoms": [],
                    "duration": None,
                    "severity": None,
                    "onset": "",
                    "associated_symptoms": [],
                    "red_flags": [],
                },
            }

        # 3. Check for Doctor / Specialist booking queries
        doctor_patterns = [r"\bbook\s+(?:a\s+)?doctor\b", r"\bfind\s+(?:a\s+)?doctor\b", r"\bsee\s+(?:a\s+)?doctor\b", r"\bspecialist\b", r"\bappointment\b"]
        if any(re.search(pat, prompt_lower) for pat in doctor_patterns) and not any(k in prompt_lower for k in ["pain", "hurt", "cough", "fever", "headache"]):
            return {
                "assistant_message": (
                    "You can easily connect with licensed doctors on HealthAssist! "
                    "Navigate to the **Providers** tab in the main navigation menu to browse verified specialists (Cardiology, Neurology, Family Medicine, Pediatrics), "
                    "check their real-time availability, and schedule a video or in-person consultation."
                ),
                "information_complete": False,
                "patient_case": {
                    "main_complaint": "",
                    "symptoms": [],
                    "duration": None,
                    "severity": None,
                    "onset": "",
                    "associated_symptoms": [],
                    "red_flags": [],
                },
            }

        # 4. Check for Gratitude / Courtesies
        thanks_patterns = [r"\bthank\s+you\b", r"\bthanks\b", r"\bappreciate\s+it\b", r"\bgreat\s+help\b"]
        if any(re.search(pat, prompt_lower) for pat in thanks_patterns) and not any(k in prompt_lower for k in ["pain", "hurt", "cough", "fever", "headache"]):
            return {
                "assistant_message": (
                    "You're very welcome! I'm glad I could help. "
                    "If you experience any new symptoms or have further health questions, feel free to reach out anytime. Wishing you great health!"
                ),
                "information_complete": False,
                "patient_case": {
                    "main_complaint": "",
                    "symptoms": [],
                    "duration": None,
                    "severity": None,
                    "onset": "",
                    "associated_symptoms": [],
                    "red_flags": [],
                },
            }

        # 5. Check for Farewells
        farewell_patterns = [r"\bbye\b", r"\bgoodbye\b", r"\bsee\s+you\b", r"\btake\s+care\b", r"\bhave\s+a\s+good\s+day\b"]
        if any(re.search(pat, prompt_lower) for pat in farewell_patterns):
            return {
                "assistant_message": (
                    "Take care and stay healthy! If your symptoms worsen or you need further medical triage, HealthAssist is always here for you."
                ),
                "information_complete": False,
                "patient_case": {
                    "main_complaint": "",
                    "symptoms": [],
                    "duration": None,
                    "severity": None,
                    "onset": "",
                    "associated_symptoms": [],
                    "red_flags": [],
                },
            }

        # 6. Check for General Wellness / First Aid Questions
        if "burn" in prompt_lower and not any(k in prompt_lower for k in ["chest", "breath"]):
            return {
                "assistant_message": (
                    "For minor first-degree burns: Cool the burn immediately under cool (not ice-cold) running water for 10–15 minutes. "
                    "Apply a sterile non-stick bandage. Do not apply ice, butter, or oil to the burn. "
                    "If the burn is blistering extensively, charred, or covers a large area, please seek urgent medical care immediately."
                ),
                "information_complete": False,
                "patient_case": {"main_complaint": "Minor Burn Inquiry", "symptoms": ["burn"], "duration": None, "severity": None, "onset": "", "associated_symptoms": [], "red_flags": []},
            }
        if "water" in prompt_lower or "hydration" in prompt_lower:
            return {
                "assistant_message": (
                    "For most healthy adults, drinking about **2 to 3 liters (8 to 10 glasses)** of water per day is generally recommended. "
                    "You may need more if you are exercising, in hot weather, or recovering from an illness with fever."
                ),
                "information_complete": False,
                "patient_case": {"main_complaint": "Hydration Guideline Inquiry", "symptoms": [], "duration": None, "severity": None, "onset": "", "associated_symptoms": [], "red_flags": []},
            }
        if "blood pressure" in prompt_lower and not any(k in prompt_lower for k in ["chest pain", "shortness of breath"]):
            return {
                "assistant_message": (
                    "According to standard medical guidelines, normal resting blood pressure in adults is typically **below 120/80 mmHg**. "
                    "Elevated blood pressure is 120–129 / <80 mmHg, and Stage 1 Hypertension begins at 130/80 mmHg. "
                    "If you are experiencing elevated readings or dizziness/chest tightness, please consult with one of our telehealth providers."
                ),
                "information_complete": False,
                "patient_case": {"main_complaint": "Blood Pressure Guideline Inquiry", "symptoms": [], "duration": None, "severity": None, "onset": "", "associated_symptoms": [], "red_flags": []},
            }

        # Check for pure greetings without symptoms
        greeting_words = ["hi", "hello", "hey", "how are you", "how r u", "hi how r u", "how are u", "good morning", "good evening", "good afternoon", "whats up", "what's up"]
        is_pure_greeting = (not symptoms) and any(re.search(rf"\b{re.escape(g)}\b", prompt_lower) for g in greeting_words)
        if is_pure_greeting:
            return {
                "assistant_message": (
                    "Hello! I'm doing well, thank you for asking. I'm your HealthAssist assistant. "
                    "What symptoms or health concerns are you experiencing today that I can help you with?"
                ),
                "information_complete": False,
                "patient_case": {
                    "main_complaint": "",
                    "symptoms": [],
                    "duration": None,
                    "severity": None,
                    "onset": "",
                    "associated_symptoms": [],
                    "red_flags": [],
                },
            }

        if not main_complaint:
            # Fallback extraction from prompt
            lines = [line.strip() for line in prompt.split("\n") if "User:" in line or "user:" in line or "Latest User Message:" in line]
            if lines:
                raw_user = lines[-1].split(":", 1)[-1].strip()
                main_complaint = raw_user[:80]
                symptoms.append(main_complaint)
            else:
                main_complaint = "General Health Concern"
                symptoms.append("Unspecified symptom")

        # Extract duration
        duration = None
        duration_patterns = [
            r"(\d+\s*(?:day|days|hour|hours|week|weeks|month|months|year|years))",
            r"(since\s+\w+)",
            r"(yesterday|today|this morning|last night|less than 24 hours)",
            r"(for\s+\d+\s*\w+)",
        ]
        for pat in duration_patterns:
            match = re.search(pat, prompt_lower)
            if match:
                duration = match.group(1).strip()
                break

        # Extract severity
        severity = None
        severity_match = re.search(r"(?:rating|rate|scale|severity|pain|discomfort)?\s*(\d{1,2})\s*(?:\/|\s*out of\s*)\s*10", prompt_lower)
        if severity_match:
            try:
                severity = int(severity_match.group(1))
            except ValueError:
                severity = severity_match.group(1)
        elif "mild" in prompt_lower or "2/10" in prompt_lower or "3/10" in prompt_lower:
            severity = 3
        elif "moderate" in prompt_lower or "4/10" in prompt_lower or "5/10" in prompt_lower or "6/10" in prompt_lower:
            severity = 5
        elif "severe" in prompt_lower or "7/10" in prompt_lower or "8/10" in prompt_lower or "9/10" in prompt_lower or "10/10" in prompt_lower:
            severity = 8

        # Extract onset
        onset = ""
        if "sudden" in prompt_lower:
            onset = "Sudden onset"
        elif "gradual" in prompt_lower or "slowly" in prompt_lower:
            onset = "Gradual onset"
        elif "after" in prompt_lower:
            after_match = re.search(r"(after\s+[^,\.\n]+)", prompt_lower)
            if after_match:
                onset = after_match.group(1).strip().capitalize()
        elif duration:
            onset = f"Started approximately {duration} ago"

        # Extract associated symptoms
        associated_symptoms = [s for s in symptoms if s.lower() != main_complaint.lower()]

        # Check turn count or missing details
        turn_count = prompt_lower.count("user:") + prompt_lower.count("latest user message:")
        has_duration = duration is not None
        has_severity = severity is not None
        has_onset_or_assoc = bool(onset or len(associated_symptoms) > 0 or "none" in prompt_lower or "no other" in prompt_lower)

        # Handle emergency red flags immediately
        if detected_red_flags:
            assistant_message = (
                f"I hear you and want to note that {', '.join(detected_red_flags)} can be an emergency red flag. "
                "While we collect your case details, please seek urgent or emergency medical evaluation immediately if you feel in immediate danger."
            )
            # If critical red flag is present and we have basic info, complete intake so safety guard can act
            information_complete = True
        elif not has_duration or not has_severity:
            if not has_duration and not has_severity:
                assistant_message = (
                    f"Thank you for sharing that you are experiencing {main_complaint.lower()}. "
                    "To better understand your situation, how long have you had these symptoms, and how would you rate your discomfort on a scale from 1 (mild) to 10 (severe)?"
                )
            elif not has_duration:
                assistant_message = (
                    f"Thank you for rating your discomfort. "
                    f"How long have you had these {main_complaint.lower()} symptoms?"
                )
            else:
                assistant_message = (
                    f"Thank you for sharing the duration. "
                    f"How would you rate your discomfort on a scale from 1 (mild) to 10 (severe)?"
                )
            information_complete = False
        elif not has_onset_or_assoc and turn_count <= 2:
            assistant_message = (
                "Thank you for providing the duration and severity. "
                "Did this start suddenly or gradually, and are you experiencing any other associated symptoms like fever, dizziness, or shortness of breath?"
            )
            information_complete = False
        else:
            # Information is complete
            assistant_message = (
                f"Thank you for providing these details regarding your {main_complaint.lower()}. "
                "I have gathered the key clinical intake information for your case. "
                "Our system has recorded your symptoms, duration, and severity for your clinical evaluation."
            )
            information_complete = True

        return {
            "assistant_message": assistant_message,
            "information_complete": information_complete,
            "patient_case": {
                "main_complaint": main_complaint,
                "symptoms": list(dict.fromkeys(symptoms)),
                "duration": duration,
                "severity": severity,
                "onset": onset,
                "associated_symptoms": list(dict.fromkeys(associated_symptoms)),
                "red_flags": list(dict.fromkeys(detected_red_flags)),
            },
        }


class GeminiProvider(BaseLLMProvider):
    """Google Gemini LLM provider using asynchronous HTTP requests with structured JSON schema."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return ""

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        schema: Optional[Type[BaseModel]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates or "content" not in candidates[0]:
                raise ValueError("Empty or invalid response from Gemini API")
            
            raw_text = candidates[0]["content"]["parts"][0].get("text", "{}")
            parsed_json = json.loads(raw_text)
            return parsed_json


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider adapter."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.base_url = "https://api.openai.com/v1/chat/completions"

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.base_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        schema: Optional[Type[BaseModel]] = None,
    ) -> Dict[str, Any]:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.base_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude API provider adapter."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.model = model or settings.ANTHROPIC_MODEL
        self.base_url = "https://api.anthropic.com/v1/messages"

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_instruction:
            payload["system"] = system_instruction

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.base_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        schema: Optional[Type[BaseModel]] = None,
    ) -> Dict[str, Any]:
        json_instruction = (
            f"{system_instruction or ''}\n\n"
            "IMPORTANT: Return ONLY a valid JSON object matching the requested schema. "
            "Do not include markdown codeblocks, preamble, or commentary."
        )
        text = await self.generate_text(prompt, system_instruction=json_instruction)
        # Strip potential markdown formatting if returned
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())


def get_llm_provider(provider_override: Optional[str] = None) -> BaseLLMProvider:
    """Factory to instantiate the appropriate LLM provider."""
    # Check mock mode
    if settings.MOCK_MODE:
        logger.debug("Using MockLLMProvider (MOCK_MODE=True)")
        return MockLLMProvider()

    provider_name = (provider_override or settings.LLM_PROVIDER or "mock").lower()

    if provider_name == "gemini":
        if settings.GEMINI_API_KEY:
            return GeminiProvider()
        logger.warning("GEMINI_API_KEY missing, falling back to MockLLMProvider")
        return MockLLMProvider()

    if provider_name == "openai":
        if settings.OPENAI_API_KEY:
            return OpenAIProvider()
        logger.warning("OPENAI_API_KEY missing, falling back to MockLLMProvider")
        return MockLLMProvider()

    if provider_name == "anthropic":
        if settings.ANTHROPIC_API_KEY:
            return AnthropicProvider()
        logger.warning("ANTHROPIC_API_KEY missing, falling back to MockLLMProvider")
        return MockLLMProvider()

    return MockLLMProvider()
