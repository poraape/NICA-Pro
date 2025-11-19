from __future__ import annotations


class BatchSpanProcessor:  # pragma: no cover - no-op
    def __init__(self, exporter):
        self.exporter = exporter


class ConsoleSpanExporter:  # pragma: no cover - no-op
    def export(self, spans):
        return None
