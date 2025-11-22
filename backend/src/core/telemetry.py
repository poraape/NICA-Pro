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
_service_version = os.getenv("OTEL_SERVICE_VERSION", os.getenv("SERVICE_VERSION", "dev"))
_environment = os.getenv("DEPLOY_ENV", "local")
_resource = Resource.create(
    {
        "service.name": _service_name,
        "service.version": _service_version,
        "deployment.environment": _environment,
    }
)

_trace_id_ctx: ContextVar[str | None] = ContextVar("trace_id", default=None)


def _otlp_requested() -> bool:
    explicit_enable = os.getenv("OTEL_EXPORTER_OTLP_ENABLED", "").lower() in {"1", "true", "yes"}
    return explicit_enable or bool(os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT") or os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"))


def _select_span_exporter():
    if not _otlp_requested():
        return ConsoleSpanExporter()

    protocol = os.getenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf").lower()
    if protocol.startswith("grpc"):
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter as GrpcSpanExporter

        return GrpcSpanExporter()
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter as HttpSpanExporter

    return HttpSpanExporter()


def _select_metric_exporter():
    if not _otlp_requested():
        return ConsoleMetricExporter()

    protocol = os.getenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf").lower()
    if protocol.startswith("grpc"):
        from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter as GrpcMetricExporter

        return GrpcMetricExporter()
    from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter as HttpMetricExporter

    return HttpMetricExporter()


tracer_provider = TracerProvider(resource=_resource)
tracer_provider.add_span_processor(BatchSpanProcessor(_select_span_exporter()))
trace.set_tracer_provider(tracer_provider)
_tracer = trace.get_tracer(__name__)

metric_reader = PeriodicExportingMetricReader(_select_metric_exporter())
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
