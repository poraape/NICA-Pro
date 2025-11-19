from __future__ import annotations

from contextlib import contextmanager
from typing import Any

_tracer_provider: Any = None


class _Span:
    def __init__(self, attributes: dict[str, object] | None = None) -> None:
        self.attributes = attributes or {}

    def __enter__(self):  # pragma: no cover - trivial
        return self

    def __exit__(self, exc_type, exc, tb):  # pragma: no cover - trivial
        return False


class _Tracer:
    @contextmanager
    def start_as_current_span(self, name: str, attributes: dict[str, object] | None = None):
        yield _Span(attributes)


def get_tracer(name: str) -> _Tracer:  # pragma: no cover - trivial
    return _Tracer()


def set_tracer_provider(provider: Any) -> None:  # pragma: no cover - no-op
    global _tracer_provider
    _tracer_provider = provider


def get_tracer_provider():  # pragma: no cover - trivial
    return _tracer_provider
