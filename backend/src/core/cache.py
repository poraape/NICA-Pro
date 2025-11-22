from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol

try:  # pragma: no cover - exercised in environments without redis installed
    from redis import Redis  # type: ignore
    _redis_import_error: Exception | None = None
except Exception as exc:  # pragma: no cover - optional dependency
    Redis = None  # type: ignore
    _redis_import_error = exc

from core.serialization import dashboard_from_json, dashboard_to_json
from domain.entities import DashboardState


class DashboardCache(Protocol):
    def get_dashboard(self, user: str) -> DashboardState | None:
        ...

    def set_dashboard(self, user: str, dashboard: DashboardState) -> None:
        ...

    def invalidate(self, user: str) -> None:
        ...


@dataclass(slots=True)
class NoopDashboardCache(DashboardCache):
    def get_dashboard(self, user: str) -> DashboardState | None:  # pragma: no cover - trivial
        return None

    def set_dashboard(self, user: str, dashboard: DashboardState) -> None:  # pragma: no cover - trivial
        return None

    def invalidate(self, user: str) -> None:  # pragma: no cover - trivial
        return None


@dataclass(slots=True)
class RedisDashboardCache(DashboardCache):
    client: Redis
    ttl_seconds: int = 300
    key_prefix: str = "dashboard"

    def _key(self, user: str) -> str:
        return f"{self.key_prefix}:{user}"

    def get_dashboard(self, user: str) -> DashboardState | None:
        cached = self.client.get(self._key(user))
        if not cached:
            return None
        return dashboard_from_json(RedisDashboardCache._decode(cached))

    def set_dashboard(self, user: str, dashboard: DashboardState) -> None:
        payload = dashboard_to_json(dashboard)
        self.client.set(self._key(user), RedisDashboardCache._encode(payload), ex=self.ttl_seconds)

    def invalidate(self, user: str) -> None:
        self.client.delete(self._key(user))

    @staticmethod
    def _encode(payload: object) -> bytes:
        return RedisDashboardCache._json_module().dumps(payload).encode("utf-8")

    @staticmethod
    def _decode(blob: bytes) -> dict:
        return RedisDashboardCache._json_module().loads(blob.decode("utf-8"))

    @staticmethod
    def _json_module():  # pragma: no cover - indirection for testability
        import json

        return json


def init_dashboard_cache(logger) -> DashboardCache:
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        logger.info("cache.disabled", extra={"reason": "REDIS_URL missing"})
        return NoopDashboardCache()

    if Redis is None:
        logger.warning(
            "cache.disabled", extra={"reason": f"redis import failed: {_redis_import_error}"}
        )
        return NoopDashboardCache()

    ttl = int(os.getenv("CACHE_TTL_SECONDS", "300"))
    client = Redis.from_url(redis_url, decode_responses=False)
    logger.info("cache.enabled", extra={"backend": "redis", "ttl_seconds": ttl})
    return RedisDashboardCache(client=client, ttl_seconds=ttl)
