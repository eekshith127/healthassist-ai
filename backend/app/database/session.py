from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.utils.config import settings

# Configure SQLite vs PostgreSQL connect_args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()



def init_db():
    """Ensures all database tables and required columns exist."""
    from sqlalchemy import text
    from backend.app.utils.logger import logger

    # 1. Create tables if not present
    Base.metadata.create_all(bind=engine)

    # 2. For PostgreSQL (Supabase), execute IF NOT EXISTS column migrations
    if not settings.DATABASE_URL.startswith("sqlite"):
        migration_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR(50);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS sex VARCHAR(50);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS height_cm FLOAT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS weight_kg FLOAT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS blood_type VARCHAR(20);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS chronic_conditions TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS medications TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS current_medications TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS allergies TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS previous_surgeries TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS family_history TEXT;",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50);",
            "ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS duration VARCHAR(100);",
            "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS severity VARCHAR(50);",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES users(id);",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS main_complaint TEXT;",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS symptoms TEXT;",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS duration VARCHAR(100);",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS severity VARCHAR(50);",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS onset VARCHAR(255);",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS associated_symptoms TEXT;",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS red_flags TEXT;",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS information_complete BOOLEAN DEFAULT TRUE;",
            "ALTER TABLE patient_cases ADD COLUMN IF NOT EXISTS raw_json TEXT;",
            "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS assessment_id VARCHAR(100);",
            """CREATE TABLE IF NOT EXISTS health_card_shares (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token VARCHAR(128) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                revoked_at TIMESTAMP NULL
            );""",
        ]
        try:
            with engine.begin() as conn:
                for stmt in migration_statements:
                    conn.execute(text(stmt))
            logger.info("Database schema columns verified and synchronized.")
        except Exception as e:
            logger.warning(f"Database schema sync notice: {e}")


def get_db():
    """Dependency that provides a database session and ensures it closes after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

