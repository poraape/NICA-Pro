from __future__ import annotations

from fastapi import FastAPI

from core.logging import configure_logging
from core.orchestrator import get_orchestrator
from api.router import router

logger = configure_logging()
get_orchestrator(logger)

app = FastAPI(title="NICA-Pro Modular Monolith", version="2.0.0")
app.include_router(router)


@app.get("/healthcheck")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "nica-pro"}
