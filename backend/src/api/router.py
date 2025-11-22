from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator, model_validator

from core.logging import configure_logging
from core.models import UserProfile
from core.orchestrator import get_orchestrator
from core.serialization import dashboard_to_json, log_to_json, plan_to_json
from core.telemetry import record_counter, set_current_trace_id, start_span
from core.tracing import TRACE_HEADER, generate_trace_id
from .schemas import DashboardResponse, DiaryResponse, Envelope, PlanResponse, ResponseMeta
from .security import AuthContext, require_auth

router = APIRouter(prefix="/api/v1", tags=["nica-pro"])
logger = configure_logging()
orchestrator = get_orchestrator(logger)


def _resolve_trace_id(request: Request) -> str:
    header_trace = request.headers.get(TRACE_HEADER)
    trace_id = getattr(request.state, "trace_id", header_trace or generate_trace_id())
    set_current_trace_id(trace_id)
    if not getattr(request.state, "trace_id", None):
        request.state.trace_id = trace_id
    return trace_id


class ProfilePayload(BaseModel):
    name: str
    age: int = Field(ge=18, le=90)
    weight_kg: float = Field(gt=30, lt=400)
    height_cm: float = Field(gt=120, lt=230)
    sex: Literal["male", "female", "other"]
    activity_level: Literal["sedentary", "light", "moderate", "intense"]
    goal: Literal["cut", "maintain", "bulk"]
    systolic_bp: int = Field(ge=90, le=220)
    diastolic_bp: int = Field(ge=50, le=140)
    sodium_mg: int = Field(ge=0, le=8000)
    allergies: list[str] = Field(default_factory=list, max_length=10)
    comorbidities: list[str] = Field(default_factory=list, max_length=10)
    bmi: float | None = None

    @field_validator("allergies", "comorbidities")
    @classmethod
    def _strip_values(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item.strip()]

    @model_validator(mode="after")
    def _compute_bmi(self) -> "ProfilePayload":
        height_m = self.height_cm / 100
        bmi = self.weight_kg / (height_m**2)
        if bmi < 15 or bmi > 60:
            raise ValueError("IMC fora da faixa segura (15-60)")
        self.bmi = round(bmi, 1)
        return self


class DiaryPayload(BaseModel):
    user: str
    entries: list[str]

    @model_validator(mode="after")
    def _ensure_entries(self) -> "DiaryPayload":
        cleaned = [entry.strip() for entry in self.entries if entry.strip()]
        if not cleaned:
            raise ValueError("Diário vazio")
        self.entries = cleaned
        return self


@router.post("/plan", response_model=Envelope[PlanResponse])
async def create_plan(
    payload: ProfilePayload,
    request: Request,
    auth: AuthContext = require_auth(["plan:write"]),
) -> Envelope[PlanResponse]:
    trace_id = _resolve_trace_id(request)
    record_counter("api.calls", attributes={"route": "plan", "actor": auth.subject})
    profile = UserProfile(**payload.model_dump())
    with start_span(
        "api.plan", {"trace_id": trace_id, "actor": auth.subject, "route": "plan"}
    ):
        plan, notes = await orchestrator.build_plan(profile, trace_id=trace_id)
    return Envelope(
        data=PlanResponse(plan=plan_to_json(plan), clinical_notes=notes),
        meta=ResponseMeta(trace_id=trace_id, actor=auth.subject),
    )


@router.post("/diary", response_model=Envelope[DiaryResponse])
async def diary(
    payload: DiaryPayload,
    request: Request,
    auth: AuthContext = require_auth(["diary:write"]),
) -> Envelope[DiaryResponse]:
    trace_id = _resolve_trace_id(request)
    record_counter("api.calls", attributes={"route": "diary", "actor": auth.subject})
    if auth.subject != payload.user:
        raise HTTPException(status_code=403, detail="Usuário autenticado não corresponde ao diário")
    with start_span(
        "api.diary", {"trace_id": trace_id, "actor": auth.subject, "route": "diary"}
    ):
        log = await orchestrator.ingest_diary(payload.user, payload.entries, trace_id=trace_id)
    return Envelope(
        data=DiaryResponse(log=log_to_json(log)),
        meta=ResponseMeta(trace_id=trace_id, actor=auth.subject),
    )


@router.get("/dashboard/{user}", response_model=Envelope[DashboardResponse])
async def dashboard(
    user: str,
    request: Request,
    auth: AuthContext = require_auth(["dashboard:read"]),
) -> Envelope[DashboardResponse]:
    trace_id = _resolve_trace_id(request)
    record_counter(
        "api.calls", attributes={"route": "dashboard", "actor": auth.subject}
    )
    if auth.subject != user:
        raise HTTPException(status_code=403, detail="Usuário autenticado não corresponde ao painel")
    try:
        with start_span(
            "api.dashboard",
            {"trace_id": trace_id, "actor": auth.subject, "route": "dashboard"},
        ):
            board = await orchestrator.refresh_dashboard(user, trace_id=trace_id)
    except ValueError as exc:  # pragma: no cover - runtime
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Envelope(
        data=DashboardResponse(dashboard=dashboard_to_json(board)),
        meta=ResponseMeta(trace_id=trace_id, actor=auth.subject),
    )
