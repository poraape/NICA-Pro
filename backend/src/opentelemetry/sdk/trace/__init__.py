from __future__ import annotations

from typing import Any

from opentelemetry.sdk.resources import Resource


class TracerProvider:
    def __init__(self, resource: Resource | None = None) -> None:
        self.resource = resource
        self.processors: list[Any] = []

    def add_span_processor(self, processor: Any) -> None:  # pragma: no cover - no-op
        self.processors.append(processor)
