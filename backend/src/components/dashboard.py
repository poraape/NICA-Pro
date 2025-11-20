from __future__ import annotations

from datetime import datetime
from statistics import mean
from typing import Iterable

from core.models import (
    DashboardAlert,
    DailyLog,
    MacroBreakdown,
    MealInspection,
    MicroBreakdown,
    NavigationLink,
    NutritionPlan,
    ProgressMetric,
    TodayOverview,
    WeekSection,
    WeeklyDayStat,
)
from agents.calc import estimate_macro_intake
from .cards import calorie_card, hydration_card, macro_card, system_card


_MACRO_COLORS = {
    "Calorias": "#ff9f0a",
    "Proteínas": "#32d74b",
    "Carboidratos": "#0a84ff",
    "Gorduras": "#ff375f",
}

_ICON_MAP = {
    "Calorias": "􀎽",
    "Proteínas": "􀅽",
    "Carboidratos": "􀣺",
    "Gorduras": "􀍞",
    "Hidratação": "􀝳",
}


def build_status_cards(
    macros_actual: MacroBreakdown,
    macros_target: MacroBreakdown,
    hydration_actual: float,
    hydration_target: float,
):
    return [
        calorie_card(macros_actual, macros_target),
        macro_card("Proteínas", macros_actual.protein_g, macros_target.protein_g),
        macro_card("Carboidratos", macros_actual.carbs_g, macros_target.carbs_g),
        macro_card("Gorduras", macros_actual.fats_g, macros_target.fats_g),
        hydration_card(hydration_actual, hydration_target),
        system_card(),
    ]


def build_today_section(
    macros_actual: MacroBreakdown,
    macros_target: MacroBreakdown,
    micros_actual: MicroBreakdown,
    micro_targets: MicroBreakdown,
    hydration_actual: float,
    hydration_target: float,
) -> TodayOverview:
    metrics = [
        ProgressMetric(
            label="Calorias",
            current=macros_actual.calories,
            target=macros_target.calories,
            unit="kcal",
            color=_MACRO_COLORS["Calorias"],
            icon=_ICON_MAP["Calorias"],
        ),
        ProgressMetric(
            label="Proteínas",
            current=macros_actual.protein_g,
            target=macros_target.protein_g,
            unit="g",
            color=_MACRO_COLORS["Proteínas"],
            icon=_ICON_MAP["Proteínas"],
        ),
        ProgressMetric(
            label="Carboidratos",
            current=macros_actual.carbs_g,
            target=macros_target.carbs_g,
            unit="g",
            color=_MACRO_COLORS["Carboidratos"],
            icon=_ICON_MAP["Carboidratos"],
        ),
        ProgressMetric(
            label="Gorduras",
            current=macros_actual.fats_g,
            target=macros_target.fats_g,
            unit="g",
            color=_MACRO_COLORS["Gorduras"],
            icon=_ICON_MAP["Gorduras"],
        ),
    ]
    hydration_metric = ProgressMetric(
        label="Hidratação",
        current=hydration_actual,
        target=hydration_target,
        unit="L",
        color="#64d2ff",
        icon=_ICON_MAP["Hidratação"],
    )
    micronutrients = [
        f"Fibra {micros_actual.fiber_g:.1f}/{micro_targets.fiber_g:.1f} g",
        f"Ômega-3 {micros_actual.omega3_mg:.0f}/{micro_targets.omega3_mg:.0f} mg",
        f"Ferro {micros_actual.iron_mg:.1f}/{micro_targets.iron_mg:.1f} mg",
        f"Cálcio {micros_actual.calcium_mg:.0f}/{micro_targets.calcium_mg:.0f} mg",
        f"Sódio {micros_actual.sodium_mg:.0f}/2000 mg",
    ]
    insights: list[str] = []
    calorie_gap = macros_target.calories - macros_actual.calories
    if calorie_gap > 0:
        insights.append(f"Faltam {calorie_gap:.0f} kcal para fechar a meta diária.")
    else:
        insights.append("Calorias atingidas — mantenha o ritmo.")
    if macros_actual.protein_g < macros_target.protein_g * 0.8:
        insights.append("Inclua fontes de proteína nas próximas refeições.")
    if hydration_actual < hydration_target:
        insights.append("Distribua goles de água entre as refeições para diluir o déficit.")
    insights.append("Micronutrientes equilibrados reduzem cravings e fadiga.")
    return TodayOverview(
        metrics=metrics,
        micronutrients=micronutrients,
        hydration=hydration_metric,
        insights=insights,
    )


def build_week_section(
    plan: NutritionPlan,
    logs: Iterable[DailyLog],
    macros_target: MacroBreakdown,
) -> WeekSection:
    bars: list[WeeklyDayStat] = []
    log_list = list(logs)
    if log_list:
        for log in sorted(log_list, key=lambda entry: entry.date)[-7:]:
            macros = estimate_macro_intake(log)
            status = _status_from_value(macros.calories, macros_target.calories)
            bars.append(
                WeeklyDayStat(
                    day=datetime.strftime(log.date, "%a"),
                    calories=round(macros.calories, 1),
                    status=status,
                )
            )
    else:
        for day in plan.days:
            status = _status_from_value(day.summary.calories, macros_target.calories)
            bars.append(
                WeeklyDayStat(
                    day=day.day[:3],
                    calories=day.summary.calories,
                    status=status,
                )
            )
    trend_line = [bar.calories for bar in bars]
    highlights = _week_highlights(bars)
    return WeekSection(bars=bars, trend_line=trend_line, highlights=highlights)


def build_meal_insights(
    plan: NutritionPlan,
    macro_targets: MacroBreakdown,
) -> list[MealInspection]:
    reference_day = plan.days[0]
    insights: list[MealInspection] = []
    for meal in reference_day.meals:
        impact = meal.calories / macro_targets.calories if macro_targets.calories else 0
        adjustment = _meal_adjustment(meal, macro_targets)
        insights.append(
            MealInspection(
                name=meal.label,
                time=meal.time,
                calories=meal.calories,
                protein_g=meal.protein_g,
                carbs_g=meal.carbs_g,
                fats_g=meal.fats_g,
                impact=f"{impact*100:.0f}% das calorias diárias",
                adjustment=adjustment,
            )
        )
    return insights


def build_navigation_links() -> list[NavigationLink]:
    return [
        NavigationLink(
            label="Macros",
            description="Acesse detalhamento de proteínas, carboidratos e gorduras",
            icon="􀟚",
            href="#macros",
        ),
        NavigationLink(
            label="Micronutrientes",
            description="Profundidade por vitamina e mineral",
            icon="􀙇",
            href="#micros",
        ),
        NavigationLink(
            label="Hidratação",
            description="Alertas e recomendações dinâmicas",
            icon="􀝳",
            href="#hydration",
        ),
        NavigationLink(
            label="Comportamentos",
            description="Padrões detectados pelo Trend-Agent",
            icon="􀑙",
            href="#behaviors",
        ),
    ]


def build_alerts(
    plan: NutritionPlan,
    macros_actual: MacroBreakdown,
    macros_target: MacroBreakdown,
    micros_actual: MicroBreakdown,
    hydration_actual: float,
    hydration_target: float,
    logs: Iterable[DailyLog],
    calc_alerts: Iterable[str],
) -> list[DashboardAlert]:
    alerts: list[DashboardAlert] = []
    if macros_actual.protein_g < macros_target.protein_g * 0.7:
        alerts.append(
            DashboardAlert(
                title="Proteína insuficiente",
                detail="Consuma pelo menos 70% da meta para preservar massa magra.",
                severity="critical",
            )
        )
    if micros_actual.fiber_g < 20:
        alerts.append(
            DashboardAlert(
                title="Fibra baixa",
                detail="Inclua vegetais crus, sementes e aveia para passar de 20 g.",
                severity="warning",
            )
        )
    if micros_actual.sodium_mg > 2000:
        alerts.append(
            DashboardAlert(
                title="Sódio elevado",
                detail="Reduza embutidos e temperos industrializados nas próximas refeições.",
                severity="warning",
            )
        )
    dinner = _find_dinner(plan)
    if dinner and dinner.carbs_g > macros_target.carbs_g * 0.4:
        alerts.append(
            DashboardAlert(
                title="Carboidrato noturno",  # per prompt
                detail="Distribua parte dos carboidratos para o lanche da tarde para evitar picos.",
                severity="info",
            )
        )
    latest_log = _latest_log(logs)
    if latest_log and _has_reactive_hunger(latest_log):
        alerts.append(
            DashboardAlert(
                title="Fome reativa",
                detail="Intervalos >4h entre refeições aumentam compulsão — programe lanches.",
                severity="warning",
            )
        )
    if hydration_actual < hydration_target * 0.9:
        alerts.append(
            DashboardAlert(
                title="Hidratação insuficiente",
                detail="Complete o volume pendente em doses de 250 ml a cada hora.",
                severity="warning",
            )
        )
    for raw in calc_alerts:
        alerts.append(
            DashboardAlert(
                title="Validação clínica",
                detail=raw,
                severity="warning",
            )
        )
    return alerts


def _status_from_value(value: float, target: float) -> str:
    if value > target * 1.05:
        return "above"
    if value < target * 0.9:
        return "below"
    return "target"


def _week_highlights(bars: list[WeeklyDayStat]) -> list[str]:
    if not bars:
        return ["Sem dados na semana"]
    above = [bar.day for bar in bars if bar.status == "above"]
    below = [bar.day for bar in bars if bar.status == "below"]
    highlights: list[str] = []
    if above:
        highlights.append(f"Acima da meta: {', '.join(above)}")
    if below:
        highlights.append(f"Abaixo da meta: {', '.join(below)}")
    avg = mean(bar.calories for bar in bars)
    highlights.append(f"Média semanal: {avg:.0f} kcal")
    return highlights


def _meal_adjustment(meal, macro_targets: MacroBreakdown) -> str:
    if meal.protein_g < macro_targets.protein_g * 0.15:
        return "Adicione ovos, iogurte grego ou proteína vegetal para subir proteínas."
    if meal.carbs_g > macro_targets.carbs_g * 0.35 and "Jantar" in meal.label:
        return "Reduza carboidratos noturnos substituindo parte por legumes fibrosos."
    if meal.fats_g < macro_targets.fats_g * 0.15:
        return "Inclua gorduras boas (azeite, castanhas) para modular saciedade."
    return "Equilíbrio mantido — continue monitorando fibras e cores no prato."


def _find_dinner(plan: NutritionPlan):
    for day in plan.days:
        for meal in day.meals:
            if "jantar" in meal.label.lower() or meal.time >= "19":
                return meal
    return None


def _latest_log(logs: Iterable[DailyLog]) -> DailyLog | None:
    log_list = list(logs)
    if not log_list:
        return None
    return sorted(log_list, key=lambda entry: entry.date)[-1]


def _has_reactive_hunger(log: DailyLog) -> bool:
    if len(log.meals) < 2:
        return False
    ordered = sorted(log.meals, key=lambda meal: meal.timestamp)
    for current, nxt in zip(ordered, ordered[1:]):
        gap = (nxt.timestamp - current.timestamp).total_seconds() / 3600
        if gap > 4.5:
            return True
    return False
