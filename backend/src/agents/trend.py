from __future__ import annotations

from asyncio import sleep
from statistics import mean

from ..core.models import TrendInsight
from ..core.serialization import log_from_json, trend_to_json
from .base import BaseAgent, JSONDict


class TrendAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Trend-Agent")

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        logs_payload = payload.get("logs", [])
        logs = [log_from_json(item) for item in logs_payload]
        if not logs:
            insight = TrendInsight(pattern="Sem histórico", signal="-", projection="Coletando dados")
            return {"trends": [trend_to_json(insight)]}
        calories = [sum(item.quantity for m in log.meals for item in m.items) * 2 for log in logs]
        avg = mean(calories)
        recent = calories[-1]
        delta = recent - avg
        projection = "Alta calórica" if delta > 100 else "Controle em dia"
        insights = [
            TrendInsight(pattern="Calorias médias", signal=f"{avg:.0f} kcal", projection=projection),
            TrendInsight(pattern="Variação", signal=f"{delta:+.0f} kcal", projection="Ajuste gradual"),
        ]
        return {"trends": [trend_to_json(insight) for insight in insights]}
