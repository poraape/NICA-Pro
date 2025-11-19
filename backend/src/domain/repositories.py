from __future__ import annotations

from typing import Protocol

from .entities import DailyLog, DashboardState, NutritionPlan, UserProfile


class Repository(Protocol):
    def upsert_profile(self, profile: UserProfile) -> None:
        """Insert or update a user profile with transactional safety."""

    def get_profile(self, user: str) -> UserProfile | None:
        """Return a user profile or None if missing."""

    def save_plan(self, plan: NutritionPlan) -> None:
        """Persist the latest nutrition plan for the user."""

    def latest_plan(self, user: str) -> NutritionPlan | None:
        """Return the most recent plan for the user."""

    def append_log(self, log: DailyLog) -> None:
        """Append a daily log entry using optimistic/pessimistic locking as needed."""

    def logs(self, user: str) -> list[DailyLog]:
        """Return ordered logs for the user (oldest → newest)."""

    def save_dashboard(self, dashboard: DashboardState) -> None:
        """Persist the latest dashboard snapshot."""

    def dashboard(self, user: str) -> DashboardState | None:
        """Return the stored dashboard snapshot if available."""

    def reset(self) -> None:
        """Clear in-memory state; optional no-op for durable backends."""


class RepositoryProvider(Protocol):
    def __call__(self) -> Repository:  # pragma: no cover - runtime DI
        ...
