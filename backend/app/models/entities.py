"""SQLAlchemy models for core NICA-Pro entities."""
from __future__ import annotations

import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.sql import func

from app.core.database import Base


JSONType = JSONB().with_variant(JSON(), "sqlite")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    auth_user_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String)
    timezone = Column(String, default="UTC")
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    metadata = Column(JSONType, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class UserGoal(Base):
    __tablename__ = "user_goals"
    __table_args__ = (
        CheckConstraint("calories_target > 0", name="ck_calories_positive"),
        CheckConstraint("protein_target >= 0"),
        CheckConstraint("carbs_target >= 0"),
        CheckConstraint("fat_target >= 0"),
        CheckConstraint("hydration_target >= 0"),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    calories_target = Column(Integer, nullable=False)
    protein_target = Column(Numeric(10, 2), nullable=True)
    carbs_target = Column(Numeric(10, 2), nullable=True)
    fat_target = Column(Numeric(10, 2), nullable=True)
    hydration_target = Column(Numeric(10, 2), nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Plan(Base):
    __tablename__ = "plans"
    __table_args__ = (UniqueConstraint("user_id", "week_start", name="uq_plan_user_week"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week_start = Column(Date, nullable=False)
    template = Column(JSONType, nullable=False)
    notes = Column(Text)
    status = Column(String, nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class Meal(Base):
    __tablename__ = "meals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String, ForeignKey("plans.id", ondelete="SET NULL"))
    meal_time = Column(DateTime(timezone=True), nullable=False)
    meal_type = Column(String)
    source = Column(String, nullable=False, default="user_entry")
    raw_input = Column(Text)
    normalized_items = Column(JSONType, nullable=False, default=list)
    calories = Column(Numeric(10, 2))
    protein = Column(Numeric(10, 2))
    carbs = Column(Numeric(10, 2))
    fat = Column(Numeric(10, 2))
    hydration = Column(Numeric(10, 2))
    inference_metadata = Column(JSONType, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class DailySummary(Base):
    __tablename__ = "daily_summaries"
    __table_args__ = (UniqueConstraint("user_id", "summary_date", name="uq_summary_user_date"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    summary_date = Column(Date, nullable=False)
    calories_total = Column(Numeric(10, 2), nullable=False, default=0)
    protein_total = Column(Numeric(10, 2), nullable=False, default=0)
    carbs_total = Column(Numeric(10, 2), nullable=False, default=0)
    fat_total = Column(Numeric(10, 2), nullable=False, default=0)
    hydration_total = Column(Numeric(10, 2), nullable=False, default=0)
    plan_snapshot = Column(JSONType)
    recalculation_scope = Column(String)
    recalculated_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
