from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field
from pydantic.generics import GenericModel


T = TypeVar("T")


class ResponseMeta(BaseModel):
    """Metadata returned with every successful response."""

    trace_id: str = Field(description="Trace identifier for correlation across telemetry pillars.")
    actor: str | None = Field(
        default=None, description="Subject associated with the request (JWT `sub` or system actor)."
    )


class Envelope(GenericModel, Generic[T]):
    """Standard API envelope for consistent client handling."""

    data: T
    meta: ResponseMeta
    message: str | None = Field(default=None, description="Optional human-readable message.")


class PlanResponse(BaseModel):
    plan: dict
    clinical_notes: list[str]

    model_config = {"extra": "forbid"}


class DiaryResponse(BaseModel):
    log: dict

    model_config = {"extra": "forbid"}


class DashboardResponse(BaseModel):
    dashboard: dict

    model_config = {"extra": "forbid"}
