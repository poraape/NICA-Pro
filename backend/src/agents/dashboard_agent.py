from __future__ import annotations

from asyncio import sleep
from datetime import datetime

from ..components.dashboard import (
    build_alerts,
    build_meal_insights,
    build_navigation_links,
    build_status_cards,
    build_today_section,
    build_week_section,
)
from ..core.models import DashboardState
from ..core.serialization import (
    chart_from_json,
    coaching_from_json,
    dashboard_to_json,
    log_from_json,
    macro_from_json,
    micro_from_json,
    plan_from_json,
)
from .base import BaseAgent, JSONDict


class DashboardAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Dashboard-Agent")

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        plan = plan_from_json(payload["plan"])
        macros_actual = macro_from_json(payload["actuals"])
        macros_target = macro_from_json(payload["targets"])
        micros_actual = micro_from_json(payload["micros"])
        micro_targets = micro_from_json(payload["micro_targets"])
        hydration_target = float(payload["hydration_target"])
        hydration_actual = float(payload["hydration_actual"])
        logs = [log_from_json(item) for item in payload.get("logs", [])]
        charts = [chart_from_json(chart) for chart in payload.get("charts", [])]
        messages = [coaching_from_json(msg) for msg in payload.get("messages", [])]
        calc_alerts = payload.get("calc_alerts", [])

        cards = build_status_cards(
            macros_actual, macros_target, hydration_actual, hydration_target
        )
        today = build_today_section(
            macros_actual,
            macros_target,
            micros_actual,
            micro_targets,
            hydration_actual,
            hydration_target,
        )
        week = build_week_section(plan, logs, macros_target)
        meal_insights = build_meal_insights(plan, macros_target)
        alerts = build_alerts(
            plan,
            macros_actual,
            macros_target,
            micros_actual,
            hydration_actual,
            hydration_target,
            logs,
            calc_alerts,
        )
        navigation = build_navigation_links()

        board = DashboardState(
            user=payload["user"],
            cards=cards,
            charts=charts,
            coach_messages=messages,
            today=today,
            week=week,
            meal_insights=meal_insights,
            alerts=alerts,
            navigation=navigation,
            last_updated=datetime.utcnow(),
        )
        return {"dashboard": dashboard_to_json(board)}
