from __future__ import annotations

from datetime import datetime

from core.models import DashboardCard, MacroBreakdown


def macro_card(label: str, value: float, target: float) -> DashboardCard:
    delta = value - target
    return DashboardCard(
        label=label,
        value=f"{value:.0f} g",
        delta=f"{delta:+.0f} g",
        positive=delta <= 0,
    )


def calorie_card(macros: MacroBreakdown, target: MacroBreakdown) -> DashboardCard:
    delta = macros.calories - target.calories
    return DashboardCard(
        label="Calorias",
        value=f"{macros.calories:.0f} kcal",
        delta=f"{delta:+.0f} kcal",
        positive=abs(delta) <= target.calories * 0.05,
    )


def hydration_card(consumed: float, target: float) -> DashboardCard:
    delta = consumed - target
    return DashboardCard(
        label="Hidratação",
        value=f"{consumed:.1f} L",
        delta=f"{delta:+.1f} L",
        positive=consumed >= target,
    )


def system_card() -> DashboardCard:
    now = datetime.utcnow().strftime("%d %b %H:%M")
    return DashboardCard(label="Orquestrador", value="Online", delta=now, positive=True)
