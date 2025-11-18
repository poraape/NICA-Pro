"""Regras simples de coaching para o dashboard."""
from __future__ import annotations

from datetime import date
from typing import Iterable

from app.schemas.summary import GoalSnapshot, MacroTotals


def _format_diff(prefix: str, diff: float, unit: str) -> str:
    magnitude = abs(round(diff))
    return f"{prefix} em {magnitude}{unit}" if magnitude else ""


def generate_insights(
    goal: GoalSnapshot | None,
    today_totals: MacroTotals,
    recent_history: Iterable[dict[str, float | date]],
) -> list[str]:
    """Gera mensagens amigáveis com base na diferença para as metas."""

    insights: list[str] = []
    if goal:
        if goal.calories_target:
            diff = today_totals.calories - goal.calories_target
            if diff > 120:
                insights.append(_format_diff("Calorias acima da meta", diff, " kcal"))
            elif diff < -120:
                insights.append(_format_diff("Calorias abaixo da meta", diff, " kcal"))
            else:
                insights.append("Calorias dentro da faixa planejada — ótimo controle!")

        if goal.protein_target:
            diff = (goal.protein_target or 0) - today_totals.protein
            if diff > 5:
                insights.append(_format_diff("Proteína abaixo da meta", diff, " g"))
            elif diff < -5:
                insights.append(_format_diff("Proteína acima do planejado", diff, " g"))

        if goal.hydration_target:
            diff = (goal.hydration_target or 0) - today_totals.hydration
            if diff > 0.2:
                insights.append(_format_diff("Hidratação abaixo do ideal", diff, " L"))
            else:
                insights.append("Hidratação dentro do esperado — continue!" )

    # Consistência em 3 dias
    if goal and goal.calories_target and recent_history:
        last_three = list(recent_history)[-3:]
        close_days = [entry for entry in last_three if abs(entry.get("calories", 0) - goal.calories_target) <= 100]
        if len(close_days) >= 2:
            insights.append("Boa consistência nos últimos 3 dias — progresso sólido!")

    if not insights:
        insights.append("Continue registrando suas refeições para liberar recomendações personalizadas.")
    return insights
