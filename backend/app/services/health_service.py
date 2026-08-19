from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.app.schemas.health import HealthResponse
from backend.app.utils.config import settings
from backend.app.utils.logger import logger


class HealthService:
    @staticmethod
    def check_health(db: Session) -> HealthResponse:
        db_status = "connected"
        try:
            db.execute(text("SELECT 1"))
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_status = f"unhealthy: {str(e)}"

        return HealthResponse(
            status="ok",
            service=settings.APP_NAME,
            version=settings.APP_VERSION,
            environment=settings.ENVIRONMENT,
            database=db_status,
        )
