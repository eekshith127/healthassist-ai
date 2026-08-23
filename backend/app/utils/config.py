from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "HealthAssist"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # DATABASE_URL must be set to Supabase's transaction pooler URL in deployed environments.
    DATABASE_URL: str = "sqlite:///./healthassist.db"
    DIRECT_URL: str = ""
    SUPABASE_URL: str = ""

    # Clerk JWT verification. Clerk owns sign-in and token issuance.
    CLERK_JWT_KEY: str = ""
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""

    # Clerk owns authentication. This is supplied by the deployment environment.
    SECRET_KEY: str = ""

    # Clerk Authentication
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWKS_URL: str = "https://api.clerk.com/v1/jwks"
    CLERK_ISSUER: str = ""

    # AI API Keys & Provider Settings (Backend-only)
    MOCK_MODE: bool = True
    LLM_PROVIDER: str = "mock"  # mock, gemini, nvidia, ollama, openai, anthropic

    # AI Provider Roles
    INTAKE_PROVIDER: str = "gemini"
    ASSESSMENT_PROVIDER_1: str = "nvidia"
    ASSESSMENT_PROVIDER_2: str = "ollama"
    ASSESSMENT_PROVIDER_3: str = "model3"
    JUDGE_PROVIDER: str = "nvidia"

    # 1. Gemini Settings (Intake AI)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # 2. NVIDIA Settings (Assessment Model #1)
    NVIDIA_API_KEY: str = ""
    NVIDIA_MODEL: str = "meta/llama-3.3-70b-instruct"
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    # 3. Ollama Settings (Assessment Model #2)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_API_KEY: str = ""
    OLLAMA_MODEL: str = "llama3.2"

    # 4. Third Assessment Model Settings (Assessment Model #3)
    MODEL3_API_KEY: str = ""
    MODEL3_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    MODEL3_MODEL: str = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

    # 5. AI Judge Settings
    JUDGE_API_KEY: str = ""
    JUDGE_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    JUDGE_MODEL: str = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

    # Legacy & Auxiliary Providers
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    model_config = SettingsConfigDict(
        env_file=["backend/.env", ".env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        # Strip pgbouncer query parameter as psycopg does not accept it as a connection argument
        if "?pgbouncer=true" in value:
            value = value.replace("?pgbouncer=true", "")
        elif "&pgbouncer=true" in value:
            value = value.replace("&pgbouncer=true", "")
        return value


settings = Settings()
