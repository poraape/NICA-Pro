from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import datetime
from typing import Generator

from sqlalchemy import create_engine, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from ..core.serialization import (
    dashboard_from_json,
    dashboard_to_json,
    log_from_json,
    log_to_json,
    plan_from_json,
    plan_to_json,
    profile_from_json,
    profile_to_json,
)
from ..domain.entities import DailyLog, DashboardState, NutritionPlan, UserProfile
from ..domain.repositories import Repository
from .models import Base, DailyLogRecord, DashboardRecord, PlanRecord, ProfileRecord
from .seeds import ensure_reference_data


_ENGINE: Engine | None = None


def _get_database_url() -> str:
    return os.getenv("DATABASE_URL", "sqlite+pysqlite:///./nica.db")


def _get_engine() -> Engine:
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = create_engine(_get_database_url(), future=True, pool_pre_ping=True)
        Base.metadata.create_all(_ENGINE)
    return _ENGINE


def _session_factory() -> sessionmaker[Session]:
    engine = _get_engine()
    return sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


class PostgresRepository(Repository):
    def __init__(self, session_factory: sessionmaker[Session] | None = None) -> None:
        self._session_factory = session_factory or _session_factory()
        self._ensure_seeds()

    @contextmanager
    def _session(self) -> Generator[Session, None, None]:
        session = self._session_factory()
        try:
            yield session
        finally:
            session.close()

    def _ensure_seeds(self) -> None:
        with self._session() as session, session.begin():
            ensure_reference_data(session)

    def upsert_profile(self, profile: UserProfile) -> None:
        data = profile_to_json(profile)
        with self._session() as session, session.begin():
            stmt = select(ProfileRecord).where(ProfileRecord.name == profile.name).with_for_update()
            result = session.execute(stmt).scalar_one_or_none()
            if result:
                result.payload = data
                result.updated_at = datetime.utcnow()
            else:
                session.add(ProfileRecord(name=profile.name, payload=data))

    def get_profile(self, user: str) -> UserProfile | None:
        with self._session() as session:
            record = session.get(ProfileRecord, user)
            return profile_from_json(record.payload) if record else None

    def save_plan(self, plan: NutritionPlan) -> None:
        payload = plan_to_json(plan)
        with self._session() as session, session.begin():
            session.add(PlanRecord(user=plan.user, payload=payload))

    def latest_plan(self, user: str) -> NutritionPlan | None:
        with self._session() as session:
            stmt = (
                select(PlanRecord)
                .where(PlanRecord.user == user)
                .order_by(PlanRecord.created_at.desc())
                .limit(1)
                .with_for_update(nowait=False, of=PlanRecord)
            )
            record = session.execute(stmt).scalar_one_or_none()
            return plan_from_json(record.payload) if record else None

    def append_log(self, log: DailyLog) -> None:
        payload = log_to_json(log)
        with self._session() as session, session.begin():
            stmt = (
                select(PlanRecord.id)
                .where(PlanRecord.user == log.user)
                .order_by(PlanRecord.created_at.desc())
                .limit(1)
                .with_for_update()
            )
            session.execute(stmt)
            session.add(
                DailyLogRecord(user=log.user, log_date=log.date, payload=payload)
            )

    def logs(self, user: str) -> list[DailyLog]:
        with self._session() as session:
            stmt = (
                select(DailyLogRecord)
                .where(DailyLogRecord.user == user)
                .order_by(DailyLogRecord.log_date.asc())
            )
            records = session.execute(stmt).scalars().all()
            return [log_from_json(record.payload) for record in records]

    def save_dashboard(self, dashboard: DashboardState) -> None:
        payload = dashboard_to_json(dashboard)
        with self._session() as session, session.begin():
            stmt = (
                select(DashboardRecord)
                .where(DashboardRecord.user == dashboard.user)
                .with_for_update()
            )
            record = session.execute(stmt).scalar_one_or_none()
            if record:
                record.payload = payload
                record.updated_at = datetime.utcnow()
            else:
                session.add(DashboardRecord(user=dashboard.user, payload=payload))

    def dashboard(self, user: str) -> DashboardState | None:
        with self._session() as session:
            record = session.get(DashboardRecord, user)
            return dashboard_from_json(record.payload) if record else None

    def reset(self) -> None:
        with self._session() as session, session.begin():
            session.query(DashboardRecord).delete()
            session.query(DailyLogRecord).delete()
            session.query(PlanRecord).delete()
            session.query(ProfileRecord).delete()


_repository: PostgresRepository | None = None


def get_repository() -> PostgresRepository:
    global _repository
    if not _repository:
        _repository = PostgresRepository()
    return _repository
