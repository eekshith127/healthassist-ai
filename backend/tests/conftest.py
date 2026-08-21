import pytest
from backend.app.database.session import Base, engine
# Import all models so metadata is complete
import backend.app.models.user
import backend.app.models.health_profile
import backend.app.models.assessment


@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
