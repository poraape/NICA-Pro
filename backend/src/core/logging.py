from __future__ import annotations

import json
import logging
import time
from logging import Logger
from typing import Any, Dict

from .telemetry import get_current_trace_id

STANDARD_FIELDS = {
    "name",
    "msg",
    "args",
    "levelname",
    "levelno",
    "pathname",
    "filename",
    "module",
    "exc_info",
    "exc_text",
    "stack_info",
    "lineno",
    "funcName",
    "created",
    "msecs",
    "relativeCreated",
    "thread",
    "threadName",
    "processName",
    "process",
    "message",
    "trace_id",
}


class TraceIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:  # pragma: no cover - trivial
        record.trace_id = get_current_trace_id() or "-"
        return True


class JsonFormatter(logging.Formatter):
    converter = time.gmtime

    def format(self, record: logging.LogRecord) -> str:  # pragma: no cover - formatting
        record.message = record.getMessage()
        log: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt or "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "trace_id": getattr(record, "trace_id", "-"),
            "message": record.message,
        }
        for key, value in record.__dict__.items():
            if key not in STANDARD_FIELDS:
                log[key] = value
        if record.exc_info:
            log["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log, ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> Logger:
    logger = logging.getLogger("nica_pro")
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.addFilter(TraceIdFilter())
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
    logger.propagate = False
    logger.debug("Unified logging configured")
    return logger
