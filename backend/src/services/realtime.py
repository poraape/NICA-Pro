from __future__ import annotations

import json
from typing import Any

from agents.base import JSONDict


class RealtimePublisher:
    """Lightweight Supabase Realtime broadcaster stub."""

    def __init__(self, logger: Any | None = None) -> None:
        self.logger = logger

    async def broadcast(self, channel: str, event: str, data: JSONDict) -> None:
        payload = {
            "channel": channel,
            "event": event,
            "data": data,
        }
        if self.logger:
            self.logger.info("supabase.broadcast", extra=payload)
        else:  # pragma: no cover - optional logging
            print(json.dumps(payload))
