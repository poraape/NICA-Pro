from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import DefaultDict

from ..core.models import DailyLog, DashboardState, NutritionPlan, UserProfile


class MemoryRepository:
    def __init__(self) -> None:
        self._profiles: dict[str, UserProfile] = {}
        self._plans: dict[str, NutritionPlan] = {}
        self._logs: DefaultDict[str, list[DailyLog]] = defaultdict(list)
        self._dashboards: dict[str, DashboardState] = {}

    def upsert_profile(self, profile: UserProfile) -> None:
        self._profiles[profile.name] = profile

    def get_profile(self, user: str) -> UserProfile | None:
        return self._profiles.get(user)

    def save_plan(self, plan: NutritionPlan) -> None:
        self._plans[plan.user] = plan

    def latest_plan(self, user: str) -> NutritionPlan | None:
        return self._plans.get(user)

    def append_log(self, log: DailyLog) -> None:
        self._logs[log.user].append(log)

    def logs(self, user: str) -> list[DailyLog]:
        return self._logs[user]

    def save_dashboard(self, dashboard: DashboardState) -> None:
        self._dashboards[dashboard.user] = dashboard

    def dashboard(self, user: str) -> DashboardState | None:
        return self._dashboards.get(user)

    def reset(self) -> None:
        self._profiles.clear()
        self._plans.clear()
        self._logs.clear()
        self._dashboards.clear()


repository = MemoryRepository()
