from __future__ import annotations

import os
from contextvars import ContextVar
from typing import Mapping

from opentelemetry import metrics, trace
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import (
    ConsoleMetricExporter,
    PeriodicExportingMetricReader,
)
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

_service_name = os.getenv("OTEL_SERVICE_NAME", "nica-pro")
_resource = Resource.create({"service.name": _service_name})

_trace_id_ctx: ContextVar[str | None] = ContextVar("trace_id", default=None)


tracer_provider = TracerProvider(resource=_resource)
tracer_provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(tracer_provider)
_tracer = trace.get_tracer(__name__)

metric_reader = PeriodicExportingMetricReader(ConsoleMetricExporter())
metrics.set_meter_provider(MeterProvider(resource=_resource, metric_readers=[metric_reader]))
_meter = metrics.get_meter(__name__)


def set_current_trace_id(trace_id: str | None) -> None:
    """Persist the current trace identifier in a context variable for log correlation."""

    _trace_id_ctx.set(trace_id)


def get_current_trace_id() -> str | None:
    return _trace_id_ctx.get()


def get_tracer(name: str | None = None):  # pragma: no cover - thin wrapper
    return trace.get_tracer(name or _service_name)


def start_span(name: str, attributes: Mapping[str, object] | None = None):
    return _tracer.start_as_current_span(name, attributes=attributes or {})


def record_counter(name: str, amount: int = 1, attributes: Mapping[str, object] | None = None) -> None:
    counter = _meter.create_counter(name)
    counter.add(amount, attributes=attributes or {})
