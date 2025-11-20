from __future__ import annotations

from dataclasses import dataclass
from logging import Logger
from typing import Any, Awaitable, Callable
from uuid import uuid4

from agents.base import JSONDict
from agents.calc import CalcAgent
from agents.coach import CoachAgent
from agents.nlp_agent import NLPAgent
from agents.planner import PlannerAgent
from agents.trend import TrendAgent
from agents.ui import UIAgent
from core.constants import PAYLOAD_VERSION
from core.models import (
    DailyLog,
    DashboardState,
    MacroBreakdown,
    MicroBreakdown,
    NutritionPlan,
    TrendInsight,
    UserProfile,
)
from core.serialization import (
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
    trend_to_json,
)
from database import get_repository
from domain.repositories import Repository
from services.event_bus import AsyncEventBus, Event
from services import charting
from services.realtime import RealtimePublisher
from .validation import validate_profile
from .tracing import generate_trace_id
from .telemetry import record_counter, set_current_trace_id, start_span


@dataclass
class CalcSnapshot:
    macros: MacroBreakdown
    micros: MicroBreakdown
    hydration_actual: float
    alerts: list[str]


@dataclass
class PipelineState:
    user: str
    plan: NutritionPlan
    profile: UserProfile
    logs: list[DailyLog]
    calc: CalcSnapshot | None = None
    trends: list[TrendInsight] | None = None
    coach_messages: list[str] | None = None


class Orchestrator:
    def __init__(
        self,
        logger: Logger,
        repository: Repository | None = None,
        realtime: RealtimePublisher | None = None,
        event_bus: AsyncEventBus | None = None,
    ) -> None:
        self.logger = logger
        self.repository = repository or get_repository()
        self.planner = PlannerAgent()
        self.nlp = NLPAgent()
        self.calc = CalcAgent()
        self.trend = TrendAgent()
        self.coach = CoachAgent()
        self.ui = UIAgent()
        self.realtime = realtime or RealtimePublisher(logger)
        self.event_bus = event_bus or AsyncEventBus(logger)
        self.tracer = start_span  # alias to reuse context manager
        self._register_pipeline_handlers()

    def _register_pipeline_handlers(self) -> None:
        self.event_bus.register("calc.requested", self._on_calc_requested)
        self.event_bus.register("trend.requested", self._on_trend_requested)
        self.event_bus.register("coach.requested", self._on_coach_requested)
        self.event_bus.register("dashboard.requested", self._on_dashboard_requested_event)

    def _default_macros(self) -> MacroBreakdown:
        return MacroBreakdown(calories=0, protein_g=0, carbs_g=0, fats_g=0)

    def _default_micros(self) -> MicroBreakdown:
        return MicroBreakdown(fiber_g=0, omega3_mg=0, iron_mg=0, calcium_mg=0, sodium_mg=0)

    def _build_pipeline_state(self, user: str) -> PipelineState:
        plan = self.repository.latest_plan(user)
        if not plan:
            raise ValueError("Nenhum plano cadastrado")
        profile = self.repository.get_profile(user)
        if not profile:
            raise ValueError("Perfil não encontrado")
        logs = self.repository.logs(user)
        return PipelineState(user=user, plan=plan, profile=profile, logs=logs)

    async def _stage_calc(self, state: PipelineState, trace_id: str) -> PipelineState:
        set_current_trace_id(trace_id)
        latest_log = state.logs[-1] if state.logs else None
        calc_payload: JSONDict = {
            "plan": plan_to_json(state.plan),
            "log": log_to_json(latest_log) if latest_log else None,
            "profile": profile_to_json(state.profile),
            "trace_id": trace_id,
            "payload_version": PAYLOAD_VERSION,
        }
        with self.tracer(
            "pipeline.calc",
            {"trace_id": trace_id, "user": state.user, "agent": "calc"},
        ):
            calc_result = await self.calc(calc_payload)
            record_counter("agent.invocations", attributes={"agent": "calc"})
        macros = macro_from_json(calc_result["macros"])
        micros = micro_from_json(calc_result["micros"])
        hydration_actual = float(calc_result["hydration_l"])
        state.calc = CalcSnapshot(
            macros=macros,
            micros=micros,
            hydration_actual=hydration_actual,
            alerts=calc_result.get("alerts", []),
        )
        return state

    async def _stage_trends(self, state: PipelineState, trace_id: str) -> PipelineState:
        set_current_trace_id(trace_id)
        trends_payload = {
            "logs": [log_to_json(log) for log in state.logs],
            "trace_id": trace_id,
            "payload_version": PAYLOAD_VERSION,
        }
        with self.tracer(
            "pipeline.trend",
            {"trace_id": trace_id, "user": state.user, "agent": "trend"},
        ):
            trend_result = await self.trend(trends_payload)
            record_counter("agent.invocations", attributes={"agent": "trend"})
        state.trends = [trend_from_json(item) for item in trend_result.get("trends", [])]
        return state

    async def _stage_coach(self, state: PipelineState, trace_id: str) -> PipelineState:
        set_current_trace_id(trace_id)
        coach_payload = {
            "macros": macro_to_json(state.calc.macros if state.calc else self._default_macros()),
            "targets": macro_to_json(state.plan.macro_targets),
            "micros": micro_to_json(state.calc.micros if state.calc else self._default_micros()),
            "trends": [trend_to_json(trend) for trend in (state.trends or [])],
            "trace_id": trace_id,
            "payload_version": PAYLOAD_VERSION,
        }
        with self.tracer(
            "pipeline.coach",
            {"trace_id": trace_id, "user": state.user, "agent": "coach"},
        ):
            coach_result = await self.coach(coach_payload)
            record_counter("agent.invocations", attributes={"agent": "coach"})
        state.coach_messages = coach_result.get("messages", [])
        return state

    async def _stage_dashboard(self, state: PipelineState, trace_id: str) -> DashboardState:
        set_current_trace_id(trace_id)
        charts = []
        if state.logs:
            charts.append(charting.timeline_chart(state.logs))
            charts.append(charting.pie_chart_from_meals(state.logs[-1]))
        if state.calc:
            charts.append(charting.radar_chart(state.plan.macro_targets, state.calc.macros))
            charts.append(
                charting.micronutrient_radar(state.plan.micro_targets, state.calc.micros)
            )
            charts.append(
                charting.bar_chart_hydration(
                    state.plan.hydration.total_liters, state.calc.hydration_actual
                )
            )
        coach_result = state.coach_messages or []
        ui_payload = {
            "user": state.user,
            "plan": plan_to_json(state.plan),
            "targets": macro_to_json(state.plan.macro_targets),
            "actuals": macro_to_json(state.calc.macros if state.calc else self._default_macros()),
            "micros": micro_to_json(state.calc.micros if state.calc else self._default_micros()),
            "micro_targets": micro_to_json(state.plan.micro_targets),
            "hydration_target": state.plan.hydration.total_liters,
            "hydration_actual": state.calc.hydration_actual if state.calc else 0,
            "charts": [chart_to_json(chart) for chart in charts],
            "messages": coach_result,
            "logs": [log_to_json(log) for log in state.logs],
            "calc_alerts": state.calc.alerts if state.calc else [],
            "trace_id": trace_id,
            "payload_version": PAYLOAD_VERSION,
        }
        with self.tracer(
            "pipeline.dashboard",
            {"trace_id": trace_id, "user": state.user, "agent": "dashboard"},
        ):
            ui_result = await self.ui(ui_payload)
            record_counter("agent.invocations", attributes={"agent": "dashboard"})
        dashboard = dashboard_from_json(ui_result["dashboard"])
        self.repository.save_dashboard(dashboard)
        await self._broadcast(state.user, "dashboard.updated", dashboard_to_json(dashboard))
        self._log_event("dashboard.refresh", user=state.user, charts=len(charts), trace_id=trace_id)
        return dashboard

    async def _on_calc_requested(self, event: Event) -> None:
        state = self._build_pipeline_state(event.payload["user"])
        state = await self._stage_calc(state, event.trace_id)
        await self.event_bus.publish(
            Event(
                name="trend.requested",
                payload={"state": state},
                trace_id=event.trace_id,
                version=event.version,
                idempotency_key=f"trend:{state.user}:{event.version}:{event.trace_id}",
            )
        )

    async def _on_trend_requested(self, event: Event) -> None:
        state: PipelineState = event.payload["state"]
        state = await self._stage_trends(state, event.trace_id)
        await self.event_bus.publish(
            Event(
                name="coach.requested",
                payload={"state": state},
                trace_id=event.trace_id,
                version=event.version,
                idempotency_key=f"coach:{state.user}:{event.version}:{event.trace_id}",
            )
        )

    async def _on_coach_requested(self, event: Event) -> None:
        state: PipelineState = event.payload["state"]
        state = await self._stage_coach(state, event.trace_id)
        await self.event_bus.publish(
            Event(
                name="dashboard.requested",
                payload={"state": state},
                trace_id=event.trace_id,
                version=event.version,
                idempotency_key=f"dashboard:{state.user}:{event.version}:{event.trace_id}",
            )
        )

    async def _on_dashboard_requested_event(self, event: Event) -> None:
        state: PipelineState = event.payload["state"]
        await self._stage_dashboard(state, event.trace_id)

    async def build_plan(
        self, profile: UserProfile, trace_id: str | None = None
    ) -> tuple[NutritionPlan, list[str]]:
        trace_id = trace_id or generate_trace_id()
        set_current_trace_id(trace_id)
        notes = validate_profile(profile)
        profile_json = profile_to_json(profile)
        with self.tracer(
            "pipeline.plan", {"trace_id": trace_id, "user": profile.name, "agent": "planner"}
        ):
            plan_result = await self.planner(
                {"profile": profile_json, "trace_id": trace_id, "payload_version": PAYLOAD_VERSION}
            )
            record_counter("agent.invocations", attributes={"agent": "planner"})
        plan = plan_from_json(plan_result["plan"])
        self.repository.upsert_profile(profile)
        self.repository.save_plan(plan)
        await self._broadcast(profile.name, "plan.updated", plan_result["plan"])
        self._log_event("plan.generated", user=profile.name, days=len(plan.days), trace_id=trace_id)
        return plan, notes

    async def ingest_diary(self, user: str, entries: list[str], trace_id: str | None = None) -> DailyLog:
        trace_id = trace_id or generate_trace_id()
        set_current_trace_id(trace_id)
        log_result = await self.nlp(
            {"user": user, "entries": entries, "trace_id": trace_id, "payload_version": PAYLOAD_VERSION}
        )
        log = log_from_json(log_result["log"])
        self.repository.append_log(log)
        await self._broadcast(user, "diary.processed", log_result["log"])
        self._log_event("diary.ingested", user=user, meals=len(log.meals), trace_id=trace_id)
        await self._trigger_pipeline(user=user, trace_id=trace_id)
        return log

    async def refresh_dashboard(self, user: str, trace_id: str | None = None) -> DashboardState:
        trace_id = trace_id or generate_trace_id()
        set_current_trace_id(trace_id)
        state = self._build_pipeline_state(user)
        state = await self._stage_calc(state, trace_id)
        state = await self._stage_trends(state, trace_id)
        state = await self._stage_coach(state, trace_id)
        return await self._stage_dashboard(state, trace_id)

    async def full_cycle(
        self, profile: UserProfile, diary: list[str], trace_id: str | None = None
    ) -> DashboardState:
        trace_id = trace_id or generate_trace_id()
        set_current_trace_id(trace_id)
        await self.build_plan(profile, trace_id)
        await self.ingest_diary(profile.name, diary, trace_id=trace_id)
        return await self.refresh_dashboard(profile.name, trace_id=trace_id)

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
        plan, notes = await self.build_plan(profile, trace_id=payload.get("trace_id"))
        return {"plan": plan_to_json(plan), "clinical_notes": notes}

    async def _on_diary_logged(self, payload: JSONDict) -> JSONDict:
        log = await self.ingest_diary(
            payload["user"], payload.get("entries", []), trace_id=payload.get("trace_id")
        )
        return {"log": log_to_json(log)}

    async def _on_dashboard_requested(self, payload: JSONDict) -> JSONDict:
        board = await self.refresh_dashboard(payload["user"], trace_id=payload.get("trace_id"))
        return {"dashboard": dashboard_to_json(board)}

    async def _on_cycle_triggered(self, payload: JSONDict) -> JSONDict:
        profile = UserProfile(**payload["profile"])
        diary = payload.get("entries", [])
        board = await self.full_cycle(profile, diary, trace_id=payload.get("trace_id"))
        return {"dashboard": dashboard_to_json(board)}

    async def _trigger_pipeline(self, user: str, trace_id: str) -> None:
        await self.event_bus.publish(
            Event(
                name="calc.requested",
                payload={"user": user},
                trace_id=trace_id,
                version=PAYLOAD_VERSION,
                idempotency_key=f"calc:{user}:{PAYLOAD_VERSION}:{trace_id}",
            )
        )

    def _log_event(self, event: str, **metadata: Any) -> None:
        if "trace_id" not in metadata:
            metadata["trace_id"] = generate_trace_id()
        set_current_trace_id(metadata["trace_id"])
        self.logger.info("mas.event", extra={"event": event, **metadata})
        record_counter("orchestrator.events", attributes={"event": event})

    async def _broadcast(self, user: str, event: str, data: JSONDict) -> None:
        await self.realtime.broadcast(channel=f"user:{user}", event=event, data=data)


_orchestrator: Orchestrator | None = None


def get_orchestrator(logger: Logger) -> Orchestrator:
    global _orchestrator
    if not _orchestrator:
        _orchestrator = Orchestrator(logger)
    return _orchestrator
