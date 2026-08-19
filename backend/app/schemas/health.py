from typing import Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: Optional[str] = "HealthAssist API"
    version: Optional[str] = "0.1.0"
    environment: Optional[str] = "development"
    database: Optional[str] = "connected"
