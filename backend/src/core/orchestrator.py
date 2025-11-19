from __future__ import annotations

from logging import Logger
from typing import Any, Awaitable, Callable

from ..agents.base import JSONDict
from ..agents.calc import CalcAgent
from ..agents.coach import CoachAgent
from ..agents.nlp_agent import NLPAgent
from ..agents.planner import PlannerAgent
from ..agents.trend import TrendAgent
from ..agents.ui import UIAgent
from ..core.models import DailyLog, DashboardState, NutritionPlan, UserProfile
from ..core.serialization import (
    chart_to_json,
    dashboard_from_json,
    dashboard_to_json,
    log_from_json,
    log_to_json,
    macro_from_json,
    macro_to_json,
    micro_from_json,
    micro_to_json,
    plan_from_json,
    plan_to_json,
    profile_to_json,
    trend_from_json,
)
from ..database.memory import repository
from ..services import charting
from ..services.realtime import RealtimePublisher
from .validation import validate_profile


class Orchestrator:
    def __init__(self, logger: Logger, realtime: RealtimePublisher | None = None) -> None:
        self.logger = logger
        self.planner = PlannerAgent()
        self.nlp = NLPAgent()
        self.calc = CalcAgent()
        self.trend = TrendAgent()
        self.coach = CoachAgent()
        self.ui = UIAgent()
        self.realtime = realtime or RealtimePublisher(logger)

    async def build_plan(self, profile: UserProfile) -> NutritionPlan:
        validate_profile(profile)
        profile_json = profile_to_json(profile)
        plan_result = await self.planner({"profile": profile_json})
        plan = plan_from_json(plan_result["plan"])
        repository.upsert_profile(profile)
        repository.save_plan(plan)
        await self._broadcast(profile.name, "plan.updated", plan_result["plan"])
        self._log_event("plan.generated", user=profile.name, days=len(plan.days))
        return plan

    async def ingest_diary(self, user: str, entries: list[str]) -> DailyLog:
        log_result = await self.nlp({"user": user, "entries": entries})
        log = log_from_json(log_result["log"])
        repository.append_log(log)
        await self._broadcast(user, "diary.processed", log_result["log"])
        self._log_event("diary.ingested", user=user, meals=len(log.meals))
        return log

    async def refresh_dashboard(self, user: str) -> DashboardState:
        plan = repository.latest_plan(user)
        if not plan:
            raise ValueError("Nenhum plano cadastrado")
        profile = repository.get_profile(user)
        if not profile:
            raise ValueError("Perfil não encontrado")
        logs = repository.logs(user)
        latest_log = logs[-1] if logs else None
        calc_payload: JSONDict = {
            "plan": plan_to_json(plan),
            "log": log_to_json(latest_log) if latest_log else None,
            "profile": profile_to_json(profile),
        }
        calc_result = await self.calc(calc_payload)
        macros = macro_from_json(calc_result["macros"])
        micros = micro_from_json(calc_result["micros"])
        hydration_actual = float(calc_result["hydration_l"])
        trends_payload = {"logs": [log_to_json(log) for log in logs]}
        trend_result = await self.trend(trends_payload)
        trends = [trend_from_json(item) for item in trend_result.get("trends", [])]
        charts = []
        if logs:
            charts.append(charting.timeline_chart(logs))
            charts.append(charting.pie_chart_from_meals(logs[-1]))
        charts.append(charting.radar_chart(plan.macro_targets, macros))
        charts.append(charting.micronutrient_radar(plan.micro_targets, micros))
        charts.append(
            charting.bar_chart_hydration(
                plan.hydration.total_liters, hydration_actual
            )
        )
        coach_payload = {
            "macros": macro_to_json(macros),
            "targets": macro_to_json(plan.macro_targets),
            "micros": micro_to_json(micros),
            "trends": trend_result.get("trends", []),
        }
        coach_result = await self.coach(coach_payload)
        ui_payload = {
            "user": user,
            "plan": plan_to_json(plan),
            "targets": macro_to_json(plan.macro_targets),
            "actuals": macro_to_json(macros),
            "micros": micro_to_json(micros),
            "micro_targets": micro_to_json(plan.micro_targets),
            "hydration_target": plan.hydration.total_liters,
            "hydration_actual": hydration_actual,
            "charts": [chart_to_json(chart) for chart in charts],
            "messages": coach_result["messages"],
            "logs": [log_to_json(log) for log in logs],
            "calc_alerts": calc_result.get("alerts", []),
        }
        ui_result = await self.ui(ui_payload)
        dashboard = dashboard_from_json(ui_result["dashboard"])
        repository.save_dashboard(dashboard)
        await self._broadcast(user, "dashboard.updated", dashboard_to_json(dashboard))
        self._log_event("dashboard.refresh", user=user, charts=len(charts))
        return dashboard

    async def full_cycle(self, profile: UserProfile, diary: list[str]) -> DashboardState:
        await self.build_plan(profile)
        await self.ingest_diary(profile.name, diary)
        return await self.refresh_dashboard(profile.name)

    async def handle_event(self, event: str, payload: JSONDict) -> JSONDict:
        handlers: dict[str, Callable[[JSONDict], Awaitable[JSONDict]]] = {
            "plan.requested": self._on_plan_requested,
            "diary.logged": self._on_diary_logged,
            "dashboard.requested": self._on_dashboard_requested,
            "cycle.triggered": self._on_cycle_triggered,
        }
        if event not in handlers:
            raise ValueError(f"Evento desconhecido: {event}")
        return await handlers[event](payload)

    async def _on_plan_requested(self, payload: JSONDict) -> JSONDict:
        profile = UserProfile(**payload["profile"])
        plan = await self.build_plan(profile)
        return {"plan": plan_to_json(plan)}

    async def _on_diary_logged(self, payload: JSONDict) -> JSONDict:
        log = await self.ingest_diary(payload["user"], payload.get("entries", []))
        return {"log": log_to_json(log)}

    async def _on_dashboard_requested(self, payload: JSONDict) -> JSONDict:
        board = await self.refresh_dashboard(payload["user"])
        return {"dashboard": dashboard_to_json(board)}

    async def _on_cycle_triggered(self, payload: JSONDict) -> JSONDict:
        profile = UserProfile(**payload["profile"])
        diary = payload.get("entries", [])
        board = await self.full_cycle(profile, diary)
        return {"dashboard": dashboard_to_json(board)}

    def _log_event(self, event: str, **metadata: Any) -> None:
        self.logger.info("mas.event", extra={"event": event, **metadata})

    async def _broadcast(self, user: str, event: str, data: JSONDict) -> None:
        await self.realtime.broadcast(channel=f"user:{user}", event=event, data=data)


_orchestrator: Orchestrator | None = None


def get_orchestrator(logger: Logger) -> Orchestrator:
    global _orchestrator
    if not _orchestrator:
        _orchestrator = Orchestrator(logger)
    return _orchestrator
