from __future__ import annotations

from typing import Any

_meter_provider: Any = None


class _Counter:
    def add(self, amount: int, attributes: dict[str, object] | None = None) -> None:  # pragma: no cover - no-op
        return None


class _Meter:
    def create_counter(self, name: str) -> _Counter:  # pragma: no cover - trivial
        return _Counter()


def get_meter(name: str) -> _Meter:  # pragma: no cover - trivial
    return _Meter()


def set_meter_provider(provider: Any) -> None:  # pragma: no cover - no-op
    global _meter_provider
    _meter_provider = provider
