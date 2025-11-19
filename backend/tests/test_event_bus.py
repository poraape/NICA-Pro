import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.services.event_bus import AsyncEventBus, Event


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_event_bus_retries_and_dlq():
    bus = AsyncEventBus()
    attempts: list[int] = []

    async def handler(event: Event) -> None:
        attempts.append(event.attempt)
        if event.attempt < 1:
            raise RuntimeError("transient failure")

    bus.register("boom", handler)

    await bus.publish(
        Event(
            name="boom",
            payload={},
            trace_id="trace-123",
            max_attempts=3,
            idempotency_key="boom:trace-123",
        )
    )

    assert attempts == [0, 1]
    assert bus.drain_and_get_dlq() == []


@pytest.mark.anyio
async def test_event_bus_idempotency():
    bus = AsyncEventBus()
    calls = 0

    async def handler(event: Event) -> None:
        nonlocal calls
        calls += 1

    bus.register("once", handler)
    event = Event(name="once", payload={}, trace_id="trace-dup", idempotency_key="once:dup")

    await bus.publish(event)
    await bus.publish(event)

    assert calls == 1
    assert bus.drain_and_get_dlq() == []
