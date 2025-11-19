from __future__ import annotations

import logging
from logging import Logger

from .telemetry import get_current_trace_id


class TraceIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:  # pragma: no cover - trivial
        record.trace_id = get_current_trace_id() or "-"
        return True


def configure_logging(level: int = logging.INFO) -> Logger:
    logger = logging.getLogger("nica_pro")
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.addFilter(TraceIdFilter())
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)s | %(name)s | trace=%(trace_id)s | %(message)s"
            )
        )
        logger.addHandler(handler)
    logger.propagate = False
    logger.debug("Unified logging configured")
    return logger
