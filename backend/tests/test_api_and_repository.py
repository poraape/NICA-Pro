import asyncio
import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timezone

import pytest
from starlette.requests import Request

from src.agents.planner import PlannerAgent
from src.api.router import DiaryPayload, ProfilePayload, create_plan, dashboard, diary
from src.api.security import AuthContext
from src.core.models import DailyLog, FoodPortion, MealEntry, UserProfile
from src.core.serialization import plan_from_json, profile_to_json
from src.database import postgres


def _token(subject: str, scopes: list[str]) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=")
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": subject, "scopes": scopes, "iat": int(time.time())}).encode()
    ).rstrip(b"=")
    signing_input = b".".join([header, payload])
    signature = base64.urlsafe_b64encode(
        hmac.new(b"test-secret", signing_input, hashlib.sha256).digest()
    ).rstrip(b"=")
    return f"{header.decode()}.{payload.decode()}.{signature.decode()}"


@pytest.mark.anyio
async def test_api_endpoints_require_auth_and_emit_trace(monkeypatch: pytest.MonkeyPatch, reset_state) -> None:
    monkeypatch.setenv("AUTH_SECRET", "test-secret")
    trace_id = "trace-api"

    profile_payload = ProfilePayload(
        name="api-user",
        age=28,
        weight_kg=70,
        height_cm=178,
        sex="male",
        activity_level="moderate",
        goal="maintain",
        systolic_bp=120,
        diastolic_bp=80,
        sodium_mg=1600,
        allergies=[],
        comorbidities=[],
    )

    request_plan = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/plan",
            "headers": [(b"x-trace-id", trace_id.encode())],
            "query_string": b"",
            "client": ("test", 1234),
            "server": ("testserver", 80),
            "scheme": "http",
        }
    )
    plan_resp = await create_plan(
        profile_payload,
        request_plan,
        AuthContext(subject="api-user", scopes=["plan:write"], issued_at=datetime.now(timezone.utc)),
    )
    assert plan_resp["trace_id"] == trace_id

    diary_payload = DiaryPayload(user="api-user", entries=["200g frango grelhado", "1 xicara arroz integral"])
    request_diary = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/diary",
            "headers": [(b"x-trace-id", trace_id.encode())],
            "query_string": b"",
            "client": ("test", 1234),
            "server": ("testserver", 80),
            "scheme": "http",
        }
    )
    diary_resp = await diary(
        diary_payload,
        request_diary,
        AuthContext(subject="api-user", scopes=["diary:write"], issued_at=datetime.now(timezone.utc)),
    )
    assert diary_resp["trace_id"] == trace_id

    request_dashboard = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/dashboard/api-user",
            "headers": [(b"x-trace-id", trace_id.encode())],
            "query_string": b"",
            "client": ("test", 1234),
            "server": ("testserver", 80),
            "scheme": "http",
        }
    )
    dashboard_resp = await dashboard(
        "api-user",
        request_dashboard,
        AuthContext(subject="api-user", scopes=["dashboard:read"], issued_at=datetime.now(timezone.utc)),
    )
    assert dashboard_resp["trace_id"] == trace_id
    assert dashboard_resp["dashboard"]["user"] == "api-user"


@pytest.mark.anyio
async def test_repository_handles_concurrent_appends(reset_state) -> None:
    planner = PlannerAgent()
    profile = UserProfile(
        name="thread-user",
        age=32,
        weight_kg=75,
        height_cm=180,
        sex="male",
        activity_level="light",
        goal="maintain",
        systolic_bp=118,
        diastolic_bp=76,
        sodium_mg=1500,
    )
    plan_json = (await planner({"profile": profile_to_json(profile)}))["plan"]
    plan = plan_from_json(plan_json)

    repo = postgres.get_repository()
    repo.reset()
    repo.upsert_profile(profile)
    repo.save_plan(plan)

    async def _append(idx: int) -> None:
        log = DailyLog(
            user=profile.name,
            date=datetime(2024, 6, 1 + idx),
            meals=[
                MealEntry(
                    timestamp=datetime(2024, 6, 1 + idx, 8, 0),
                    description=f"meal-{idx}",
                    items=[FoodPortion(label="oat", quantity=50 + idx, unit="g")],
                )
            ],
        )
        await asyncio.to_thread(repo.append_log, log)

    await asyncio.gather(*[_append(i) for i in range(3)])

    logs = repo.logs(profile.name)
    assert len(logs) == 3
    assert sorted(log.date for log in logs)[0].day == 1
