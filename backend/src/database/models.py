from __future__ import annotations

import uuid

from sqlalchemy import JSON, Column, DateTime, Integer, String, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class ProfileRecord(Base):
    __tablename__ = "user_profiles"

    name = Column(String(120), primary_key=True)
    payload = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    __mapper_args__ = {"version_id_col": version}


class PlanRecord(Base):
    __tablename__ = "nutrition_plans"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user = Column(String(120), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class DailyLogRecord(Base):
    __tablename__ = "daily_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user = Column(String(120), nullable=False, index=True)
    log_date = Column(DateTime(timezone=True), nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DashboardRecord(Base):
    __tablename__ = "dashboards"

    user = Column(String(120), primary_key=True)
    payload = Column(JSON, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ReferenceEnumRecord(Base):
    __tablename__ = "reference_enums"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String(80), nullable=False, index=True)
    value = Column(String(120), nullable=False)
    label = Column(String(120), nullable=False)


class ClinicalLimitRecord(Base):
    __tablename__ = "clinical_limits"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric = Column(String(120), nullable=False, unique=True)
    min_value = Column(Integer, nullable=True)
    max_value = Column(Integer, nullable=True)
    unit = Column(String(16), nullable=False)
