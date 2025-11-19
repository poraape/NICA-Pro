from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20240601_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("name", sa.String(length=120), primary_key=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_table(
        "nutrition_plans",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user", sa.String(length=120), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index("ix_nutrition_plans_user", "nutrition_plans", ["user"])

    op.create_table(
        "daily_logs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user", sa.String(length=120), nullable=False),
        sa.Column("log_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_daily_logs_user", "daily_logs", ["user"])

    op.create_table(
        "dashboards",
        sa.Column("user", sa.String(length=120), primary_key=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.create_table(
        "reference_enums",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("value", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
    )
    op.create_index("ix_reference_enums_category", "reference_enums", ["category"])

    op.create_table(
        "clinical_limits",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("metric", sa.String(length=120), nullable=False, unique=True),
        sa.Column("min_value", sa.Integer(), nullable=True),
        sa.Column("max_value", sa.Integer(), nullable=True),
        sa.Column("unit", sa.String(length=16), nullable=False),
    )

    op.bulk_insert(
        sa.table(
            "reference_enums",
            sa.column("id", sa.String(length=64)),
            sa.column("category", sa.String(length=80)),
            sa.column("value", sa.String(length=120)),
            sa.column("label", sa.String(length=120)),
        ),
        [
            {"id": "seed-sex-m", "category": "sex", "value": "male", "label": "Masculino"},
            {"id": "seed-sex-f", "category": "sex", "value": "female", "label": "Feminino"},
            {"id": "seed-sex-o", "category": "sex", "value": "other", "label": "Outro"},
            {
                "id": "seed-act-sed",
                "category": "activity_level",
                "value": "sedentary",
                "label": "Sedentário",
            },
            {
                "id": "seed-act-light",
                "category": "activity_level",
                "value": "light",
                "label": "Leve",
            },
            {
                "id": "seed-act-mod",
                "category": "activity_level",
                "value": "moderate",
                "label": "Moderado",
            },
            {
                "id": "seed-act-int",
                "category": "activity_level",
                "value": "intense",
                "label": "Intenso",
            },
            {
                "id": "seed-goal-cut",
                "category": "goal",
                "value": "cut",
                "label": "Definição",
            },
            {
                "id": "seed-goal-maintain",
                "category": "goal",
                "value": "maintain",
                "label": "Manutenção",
            },
            {"id": "seed-goal-bulk", "category": "goal", "value": "bulk", "label": "Ganho"},
        ],
    )

    op.bulk_insert(
        sa.table(
            "clinical_limits",
            sa.column("id", sa.String(length=64)),
            sa.column("metric", sa.String(length=120)),
            sa.column("min_value", sa.Integer()),
            sa.column("max_value", sa.Integer()),
            sa.column("unit", sa.String(length=16)),
        ),
        [
            {"id": "seed-limit-bmi", "metric": "bmi", "min_value": 18, "max_value": 30, "unit": "kg/m2"},
            {
                "id": "seed-limit-sodium",
                "metric": "sodium_mg",
                "min_value": None,
                "max_value": 2300,
                "unit": "mg",
            },
            {
                "id": "seed-limit-sbp",
                "metric": "systolic_bp",
                "min_value": None,
                "max_value": 140,
                "unit": "mmHg",
            },
            {
                "id": "seed-limit-dbp",
                "metric": "diastolic_bp",
                "min_value": None,
                "max_value": 90,
                "unit": "mmHg",
            },
            {
                "id": "seed-limit-hydration",
                "metric": "hydration_ml",
                "min_value": 1500,
                "max_value": 4000,
                "unit": "ml",
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("clinical_limits")
    op.drop_index("ix_reference_enums_category", table_name="reference_enums")
    op.drop_table("reference_enums")
    op.drop_table("dashboards")
    op.drop_index("ix_daily_logs_user", table_name="daily_logs")
    op.drop_table("daily_logs")
    op.drop_index("ix_nutrition_plans_user", table_name="nutrition_plans")
    op.drop_table("nutrition_plans")
    op.drop_table("user_profiles")
