from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..core.logging import configure_logging
from ..core.models import UserProfile
from ..core.serialization import dashboard_to_json, log_to_json, plan_to_json
from ..core.orchestrator import get_orchestrator

router = APIRouter(prefix="/api/v1", tags=["nica-pro"])
logger = configure_logging()
orchestrator = get_orchestrator(logger)


class ProfilePayload(BaseModel):
    name: str
    age: int = Field(ge=18, le=90)
    weight_kg: float
    height_cm: float
    sex: str
    activity_level: str
    goal: str


class DiaryPayload(BaseModel):
    user: str
    entries: list[str]


@router.post("/plan")
async def create_plan(payload: ProfilePayload) -> dict:
    profile = UserProfile(**payload.model_dump())
    plan = await orchestrator.build_plan(profile)
    return {"plan": plan_to_json(plan)}


@router.post("/diary")
async def diary(payload: DiaryPayload) -> dict:
    if not payload.entries:
        raise HTTPException(status_code=400, detail="Diário vazio")
    log = await orchestrator.ingest_diary(payload.user, payload.entries)
    return {"log": log_to_json(log)}


@router.get("/dashboard/{user}")
async def dashboard(user: str) -> dict:
    try:
        board = await orchestrator.refresh_dashboard(user)
    except ValueError as exc:  # pragma: no cover - runtime
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"dashboard": dashboard_to_json(board)}
