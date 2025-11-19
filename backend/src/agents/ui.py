from __future__ import annotations

from asyncio import sleep

from ..core.serialization import dashboard_to_json
from .base import BaseAgent, JSONDict
from .dashboard_agent import DashboardAgent


class UIAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("UI-Agent")
        self.dashboard_agent = DashboardAgent()

    async def run(self, payload: JSONDict) -> JSONDict:
        await sleep(0)
        result = await self.dashboard_agent(payload)
        return {"dashboard": result["dashboard"]}
