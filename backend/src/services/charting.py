from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Iterable

from core.models import DailyLog, DashboardChart, MacroBreakdown, MicroBreakdown


def radar_chart(macros: MacroBreakdown, actuals: MacroBreakdown) -> DashboardChart:
    return DashboardChart(
        type="radar",
        title="Macro Targets",
        data={
            "labels": ["Protein", "Carbs", "Fats"],
            "target": [macros.protein_g, macros.carbs_g, macros.fats_g],
            "actual": [actuals.protein_g, actuals.carbs_g, actuals.fats_g],
        },
    )


def micronutrient_radar(
    targets: MicroBreakdown, actuals: MicroBreakdown
) -> DashboardChart:
    return DashboardChart(
        type="radar",
        title="Micronutrientes",
        data={
            "labels": ["Fibra", "Ômega-3", "Ferro", "Cálcio", "Sódio"],
            "target": [
                targets.fiber_g,
                targets.omega3_mg,
                targets.iron_mg,
                targets.calcium_mg,
                2000.0,
            ],
            "actual": [
                actuals.fiber_g,
                actuals.omega3_mg,
                actuals.iron_mg,
                actuals.calcium_mg,
                actuals.sodium_mg,
            ],
        },
    )


def pie_chart_from_meals(log: DailyLog) -> DashboardChart:
    totals = defaultdict(float)
    for meal in log.meals:
        totals[meal.description] += sum(item.quantity for item in meal.items)
    return DashboardChart(
        type="pie",
        title="Distribuição do Diário",
        data={"labels": list(totals.keys()), "values": list(totals.values())},
    )


def timeline_chart(logs: Iterable[DailyLog]) -> DashboardChart:
    sorted_logs = sorted(logs, key=lambda l: l.date)
    return DashboardChart(
        type="timeline",
        title="Timeline Calórica",
        data={
            "labels": [datetime.strftime(l.date, "%d/%m") for l in sorted_logs],
            "values": [sum(item.quantity for m in l.meals for item in m.items) for l in sorted_logs],
        },
    )


def bar_chart_hydration(target_l: float, actual_l: float) -> DashboardChart:
    return DashboardChart(
        type="bar",
        title="Hidratação",
        data={"target": target_l, "actual": actual_l},
    )
