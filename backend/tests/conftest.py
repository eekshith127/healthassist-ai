import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import backend.app.database.session as db_session
from backend.app.database.session import Base, get_db
from backend.app.utils.config import settings
from backend.app.main import app

# Import all models so metadata is complete
import backend.app.models.user
import backend.app.models.health_profile
import backend.app.models.assessment
import backend.app.models.patient_case
import backend.app.models.model_assessment
import backend.app.models.consensus_result
import backend.app.models.final_assessment

TEST_DB_URL = "sqlite:///./test_healthassist.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Monkeypatch SessionLocal and engine in db_session module so all test imports use test db
db_session.SessionLocal = TestingSessionLocal
db_session.engine = test_engine


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    # Force MOCK_MODE for test isolation
    orig_mock = settings.MOCK_MODE
    settings.MOCK_MODE = True

    # Create all tables on SQLite test database
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    settings.MOCK_MODE = orig_mock
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_healthassist.db"):
        try:
            os.remove("./test_healthassist.db")
        except Exception:
            pass
