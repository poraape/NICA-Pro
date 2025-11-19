from __future__ import annotations


class ConsoleMetricExporter:  # pragma: no cover - no-op
    def export(self, metrics):
        return None


class PeriodicExportingMetricReader:  # pragma: no cover - no-op
    def __init__(self, exporter: ConsoleMetricExporter):
        self.exporter = exporter
