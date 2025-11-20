from __future__ import annotations

from typing import Any

from opentelemetry.sdk.resources import Resource


class MeterProvider:
    def __init__(self, resource: Resource | None = None, metric_readers: list[Any] | None = None) -> None:
        self.resource = resource
        self.metric_readers = metric_readers or []
