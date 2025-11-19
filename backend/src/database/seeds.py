from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import ClinicalLimitRecord, ReferenceEnumRecord

SEX_ENUM = [
    {"category": "sex", "value": "male", "label": "Masculino"},
    {"category": "sex", "value": "female", "label": "Feminino"},
    {"category": "sex", "value": "other", "label": "Outro"},
]

ACTIVITY_ENUM = [
    {"category": "activity_level", "value": "sedentary", "label": "Sedentário"},
    {"category": "activity_level", "value": "light", "label": "Leve"},
    {"category": "activity_level", "value": "moderate", "label": "Moderado"},
    {"category": "activity_level", "value": "intense", "label": "Intenso"},
]

GOAL_ENUM = [
    {"category": "goal", "value": "cut", "label": "Definição"},
    {"category": "goal", "value": "maintain", "label": "Manutenção"},
    {"category": "goal", "value": "bulk", "label": "Ganho"},
]

CLINICAL_LIMITS = [
    {"metric": "bmi", "min_value": 18, "max_value": 30, "unit": "kg/m2"},
    {"metric": "sodium_mg", "min_value": None, "max_value": 2300, "unit": "mg"},
    {"metric": "systolic_bp", "min_value": None, "max_value": 140, "unit": "mmHg"},
    {"metric": "diastolic_bp", "min_value": None, "max_value": 90, "unit": "mmHg"},
    {"metric": "hydration_ml", "min_value": 1500, "max_value": 4000, "unit": "ml"},
]


def _already_seeded(session: Session) -> bool:
    enum_stmt = select(ReferenceEnumRecord).limit(1)
    limit_stmt = select(ClinicalLimitRecord).limit(1)
    return (
        session.execute(enum_stmt).first() is not None
        and session.execute(limit_stmt).first() is not None
    )


def ensure_reference_data(session: Session) -> None:
    if _already_seeded(session):
        return
    session.bulk_save_objects([ReferenceEnumRecord(**item) for item in SEX_ENUM])
    session.bulk_save_objects([ReferenceEnumRecord(**item) for item in ACTIVITY_ENUM])
    session.bulk_save_objects([ReferenceEnumRecord(**item) for item in GOAL_ENUM])
    session.bulk_save_objects([ClinicalLimitRecord(**item) for item in CLINICAL_LIMITS])
