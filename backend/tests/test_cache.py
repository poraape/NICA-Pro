from datetime import datetime
import logging

from core.cache import (
    NoopDashboardCache,
    RedisDashboardCache,
    init_dashboard_cache,
)
from core.serialization import dashboard_from_json, dashboard_to_json
from domain.entities import (
    CoachingMessage,
    DashboardAlert,
    DashboardCard,
    DashboardChart,
    DashboardState,
    NavigationLink,
    ProgressMetric,
    TodayOverview,
    WeekSection,
)


def _sample_dashboard(user: str) -> DashboardState:
    metric = ProgressMetric(
        label="Calorias",
        current=1500,
        target=2000,
        unit="kcal",
        color="#4ade80",
        icon="flame",
    )
    today = TodayOverview(
        metrics=[metric],
        micronutrients=["Ferro"],
        hydration=ProgressMetric(
            label="Hidratação", current=1.5, target=2.5, unit="L", color="#38bdf8", icon="droplet"
        ),
        insights=["Mantenha ingestão de proteína"],
    )
    week = WeekSection(bars=[], trend_line=[], highlights=[])
    return DashboardState(
        user=user,
        cards=[DashboardCard(label="Status", value="OK", delta="+1%", positive=True)],
        charts=[DashboardChart(type="bar", title="Macro", data={"protein": 120})],
        coach_messages=[CoachingMessage(title="Bem", body="Continue", severity="info")],
        today=today,
        week=week,
        meal_insights=[],
        alerts=[DashboardAlert(title="Sódio", detail="Revise ingestão", severity="warning")],
        navigation=[NavigationLink(label="Dashboard", description="Voltar", icon="home", href="/")],
        last_updated=datetime.utcnow(),
    )


def test_cache_defaults_to_noop_when_missing_env(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    cache = init_dashboard_cache(logging.getLogger("test"))
    assert isinstance(cache, NoopDashboardCache)


def test_redis_cache_round_trip(monkeypatch):
    store: dict[str, bytes] = {}

    class FakeRedis:
        def get(self, key: str):
            return store.get(key)

        def set(self, key: str, value: bytes, ex: int | None = None):
            store[key] = value

        def delete(self, key: str):
            store.pop(key, None)

    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("CACHE_TTL_SECONDS", "120")
    monkeypatch.setattr(
        "core.cache.Redis",
        type("RedisWrapper", (object,), {"from_url": staticmethod(lambda *_args, **_kwargs: FakeRedis())}),
    )

    cache = init_dashboard_cache(logging.getLogger("test"))
    assert isinstance(cache, RedisDashboardCache)

    dashboard = _sample_dashboard("cache-user")
    cache.set_dashboard("cache-user", dashboard)

    loaded = cache.get_dashboard("cache-user")
    assert loaded == dashboard

    cache.invalidate("cache-user")
    assert cache.get_dashboard("cache-user") is None

    # ensure JSON helpers round-trip complex payloads
    encoded = dashboard_to_json(dashboard)
    assert dashboard_from_json(encoded) == dashboard
