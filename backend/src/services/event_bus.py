from __future__ import annotations

import asyncio
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from ..agents.base import JSONDict
from ..core.logging import configure_logging
from ..core.telemetry import record_counter, set_current_trace_id


@dataclass
class Event:
    name: str
    payload: JSONDict
    trace_id: str
    attempt: int = 0
    max_attempts: int = 3
    version: str = "1.0"
    idempotency_key: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


Handler = Callable[[Event], Awaitable[None]]


class AsyncEventBus:
    def __init__(self, logger=None) -> None:
        self.handlers: dict[str, Handler] = {}
        self.queue: deque[Event] = deque()
        self.dlq: list[tuple[Event, str]] = []
        self._logger = logger or configure_logging()
        self._processed: set[str] = set()
        self._lock = asyncio.Lock()

    def register(self, event_name: str, handler: Handler) -> None:
        self.handlers[event_name] = handler

    async def publish(self, event: Event) -> None:
        set_current_trace_id(event.trace_id)
        async with self._lock:
            if event.idempotency_key and event.idempotency_key in self._processed:
                self._logger.debug(
                    "event.skipped", extra={"event": event.name, "trace_id": event.trace_id}
                )
                return
            self.queue.append(event)
        record_counter("event_bus.enqueued", attributes={"event": event.name})
        await self._drain()

    async def _drain(self) -> None:
        while True:
            async with self._lock:
                if not self.queue:
                    break
                event = self.queue.popleft()
            handler = self.handlers.get(event.name)
            if not handler:
                self._logger.error(
                    "event.unhandled", extra={"event": event.name, "trace_id": event.trace_id}
                )
                continue
            try:
                await handler(event)
                if event.idempotency_key:
                    self._processed.add(event.idempotency_key)
                record_counter("event_bus.processed", attributes={"event": event.name})
            except Exception as exc:  # pragma: no cover - resiliency path
                event.attempt += 1
                if event.attempt < event.max_attempts:
                    self._logger.warning(
                        "event.retry",
                        extra={
                            "event": event.name,
                            "trace_id": event.trace_id,
                            "attempt": event.attempt,
                        },
                    )
                    async with self._lock:
                        self.queue.append(event)
                else:
                    self.dlq.append((event, str(exc)))
                    self._logger.error(
                        "event.dlq",
                        extra={
                            "event": event.name,
                            "trace_id": event.trace_id,
                            "error": str(exc),
                        },
                    )
                    record_counter("event_bus.dlq", attributes={"event": event.name})

    def drain_and_get_dlq(self) -> list[tuple[Event, str]]:
        """Expose DLQ for inspection in tests."""
        return list(self.dlq)
