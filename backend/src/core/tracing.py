from __future__ import annotations

import os
import uuid

TRACE_HEADER = "x-trace-id"


def generate_trace_id() -> str:
    # Includes hostname for easier correlation across agents/nodes.
    return f"{uuid.uuid4().hex}-{os.getenv('HOSTNAME', 'local')}"
