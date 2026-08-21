"""Create the HealthAssist domain schema."""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("clerk_user_id", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("role", sa.String(50), nullable=False, server_default="patient"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime()),
        sa.UniqueConstraint("clerk_user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "health_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("age", sa.Integer()), sa.Column("gender", sa.String(50)),
        sa.Column("blood_type", sa.String(10)), sa.Column("allergies", sa.Text()),
        sa.Column("chronic_conditions", sa.Text()), sa.Column("current_medications", sa.Text()),
        sa.Column("emergency_contact", sa.String(255)), sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime()), sa.UniqueConstraint("user_id"),
    )
    op.create_table(
        "assessments",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("symptoms", sa.Text(), nullable=False), sa.Column("triage_level", sa.String(50), server_default="non-urgent"),
        sa.Column("ai_summary", sa.Text()), sa.Column("consensus_score", sa.Float()), sa.Column("safety_checked", sa.String(50), server_default="passed"),
        sa.Column("recommended_specialist", sa.String(100)), sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "patient_cases",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id"), unique=True), sa.Column("status", sa.String(30), server_default="open", nullable=False),
        sa.Column("notes", sa.Text()), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime()),
    )
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("patient_case_id", sa.Integer(), sa.ForeignKey("patient_cases.id")), sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "model_assessments",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id"), nullable=False),
        sa.Column("model_name", sa.String(100), nullable=False), sa.Column("result", sa.Text(), nullable=False), sa.Column("confidence", sa.Float()), sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "consensus_results",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id"), nullable=False, unique=True),
        sa.Column("result", sa.Text(), nullable=False), sa.Column("score", sa.Float()), sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "final_assessments",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("assessment_id", sa.Integer(), sa.ForeignKey("assessments.id"), nullable=False, unique=True),
        sa.Column("summary", sa.Text(), nullable=False), sa.Column("recommendations", sa.Text()), sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("final_assessments")
    op.drop_table("consensus_results")
    op.drop_table("model_assessments")
    op.drop_table("chat_messages")
    op.drop_table("patient_cases")
    op.drop_table("assessments")
    op.drop_table("health_profiles")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.drop_table("users")