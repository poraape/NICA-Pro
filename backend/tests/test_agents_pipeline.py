from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from src.agents.calc import CalcAgent
from src.agents.coach import CoachAgent
from src.agents.dashboard_agent import DashboardAgent
from src.agents.planner import PlannerAgent
from src.core.logging import configure_logging
from src.core.models import (
    DailyLog,
    FoodPortion,
    MacroBreakdown,
    MealEntry,
    MicroBreakdown,
    NutritionPlan,
    UserProfile,
)
from src.core.orchestrator import Orchestrator
from src.core.serialization import (
    log_to_json,
    macro_to_json,
    micro_to_json,
    plan_from_json,
    plan_to_json,
    profile_to_json,
)
from src.domain.repositories import Repository
from src.services.event_bus import AsyncEventBus
from src.services.realtime import RealtimePublisher


@pytest.fixture()
def base_profile() -> UserProfile:
    return UserProfile(
        name="ana",
        age=30,
        weight_kg=68,
        height_cm=172,
        sex="female",
        activity_level="moderate",
        goal="maintain",
        systolic_bp=120,
        diastolic_bp=80,
        sodium_mg=1500,
        allergies=["soja"],
        comorbidities=[],
    )


@pytest.fixture()
def baseline_log() -> DailyLog:
    return DailyLog(
        user="ana",
        date=datetime(2024, 6, 1),
        meals=[
            MealEntry(
                timestamp=datetime(2024, 6, 1, 13, 0),
                description="Almoço",
                items=[
                    FoodPortion(label="grilled chicken breast", quantity=150, unit="g"),
                    FoodPortion(label="brown rice", quantity=180, unit="g"),
                    FoodPortion(label="avocado", quantity=30, unit="g"),
                    FoodPortion(label="water", quantity=500, unit="ml"),
                ],
            )
        ],
    )


@pytest.mark.anyio
async def test_planner_calc_coach_dashboard_flow(base_profile: UserProfile, baseline_log: DailyLog, monkeypatch: pytest.MonkeyPatch) -> None:
    planner = PlannerAgent()
    plan_result = await planner({"profile": profile_to_json(base_profile)})
    plan = plan_from_json(plan_result["plan"])

    calc = CalcAgent()
    calc_result = await calc(
        {
            "plan": plan_to_json(plan),
            "profile": profile_to_json(base_profile),
            "log": log_to_json(baseline_log),
            "payload_version": "1.0",
        }
    )
    macros = MacroBreakdown(**calc_result["macros"])
    micros = MicroBreakdown(**calc_result["micros"])

    assert macros.calories > 0
    assert micros.fiber_g > 0

    coach = CoachAgent()
    monkeypatch.setattr("src.agents.coach.choice", lambda seq: seq[0])
    coach_result = await coach(
        {
            "macros": macro_to_json(macros),
            "targets": macro_to_json(plan.macro_targets),
            "micros": micro_to_json(micros),
            "trends": [],
        }
    )
    assert any(msg["title"] == "Consistência gentil" for msg in coach_result["messages"])

    dashboard_agent = DashboardAgent()
    dashboard_result = await dashboard_agent(
        {
            "user": base_profile.name,
            "plan": plan_to_json(plan),
            "targets": macro_to_json(plan.macro_targets),
            "actuals": macro_to_json(macros),
            "micros": micro_to_json(micros),
            "micro_targets": micro_to_json(plan.micro_targets),
            "hydration_target": plan.hydration.total_liters,
            "hydration_actual": calc_result["hydration_l"],
            "logs": [log_to_json(baseline_log)],
            "charts": [],
            "messages": coach_result["messages"],
            "calc_alerts": calc_result["alerts"],
        }
    )
    dashboard = dashboard_result["dashboard"]
    assert dashboard["user"] == base_profile.name
    assert len(dashboard.get("alerts", [])) >= 0


class _MemoryRepo(Repository):
    def __init__(self, plan: NutritionPlan, profile: UserProfile, logs: list[DailyLog]):
        self._plan = plan
        self._profile = profile
        self._logs = logs
        self.dashboard_state: dict[str, Any] | None = None

    def upsert_profile(self, profile: UserProfile) -> None:
        self._profile = profile

    def get_profile(self, user: str) -> UserProfile | None:
        return self._profile if self._profile.name == user else None

    def save_plan(self, plan: NutritionPlan) -> None:
        self._plan = plan

    def latest_plan(self, user: str) -> NutritionPlan | None:
        return self._plan if self._plan.user == user else None

    def append_log(self, log: DailyLog) -> None:
        self._logs.append(log)

    def logs(self, user: str) -> list[DailyLog]:
        return list(self._logs)

    def save_dashboard(self, dashboard) -> None:
        self.dashboard_state = dashboard

    def dashboard(self, user: str):
        return self.dashboard_state

    def reset(self) -> None:
        self._logs.clear()


class _StubRealtime(RealtimePublisher):
    def __init__(self) -> None:
        super().__init__(configure_logging())
        self.events: list[dict[str, Any]] = []

    async def broadcast(self, channel: str, event: str, data: dict[str, Any]) -> None:
        self.events.append({"channel": channel, "event": event, "data": data})


@pytest.mark.anyio
async def test_orchestrator_refreshes_dashboard(base_profile: UserProfile, baseline_log: DailyLog) -> None:
    planner = PlannerAgent()
    plan_json = (await planner({"profile": profile_to_json(base_profile)}))["plan"]
    plan = plan_from_json(plan_json)

    repo = _MemoryRepo(plan, base_profile, [baseline_log])
    realtime = _StubRealtime()
    bus = AsyncEventBus(configure_logging())
    orchestrator = Orchestrator(configure_logging(), repository=repo, realtime=realtime, event_bus=bus)

    dashboard = await orchestrator.refresh_dashboard(base_profile.name, trace_id="trace-test")

    assert dashboard.user == base_profile.name
    assert realtime.events[-1]["event"] == "dashboard.updated"
    assert repo.dashboard_state is not None
