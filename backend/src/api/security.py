from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import os
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Sequence

try:  # pragma: no cover - optional dependency
    import jwt  # type: ignore
except ImportError:  # pragma: no cover - fallback to manual JWT decode
    jwt = None

from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.logging import configure_logging


@dataclass
class AuthContext:
    subject: str
    scopes: list[str]
    issued_at: datetime


class RateLimitError(Exception):
    ...


class InMemoryRateLimiter:
    def __init__(self, limit: int = 30, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._buckets: dict[str, deque[float]] = {}
        self._lock = asyncio.Lock()

    async def hit(self, key: str) -> None:
        async with self._lock:
            now = time.time()
            bucket = self._buckets.setdefault(key, deque())
            while bucket and now - bucket[0] > self.window_seconds:
                bucket.popleft()
            if len(bucket) >= self.limit:
                raise RateLimitError("Limite de requisições excedido")
            bucket.append(now)


bearer_scheme = HTTPBearer(auto_error=False)
limiter = InMemoryRateLimiter(limit=int(os.getenv("RATE_LIMIT", "30")))
logger = configure_logging()


def _get_secret() -> str:
    return os.getenv("AUTH_SECRET", "dev-insecure-secret")


def _decode_token(token: str) -> dict:
    if jwt is not None:
        try:
            return jwt.decode(token, _get_secret(), algorithms=["HS256"])
        except Exception as exc:  # pragma: no cover - passthrough to HTTP error
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido") from exc
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token malformado") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode()
    expected_sig = hmac.new(_get_secret().encode(), signing_input, hashlib.sha256).digest()
    decoded_sig = base64.urlsafe_b64decode(signature_b64 + "==")
    if not hmac.compare_digest(expected_sig, decoded_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Assinatura inválida")

    payload_json = base64.urlsafe_b64decode(payload_b64 + "==").decode()
    return json.loads(payload_json)


def _audit(event: str, **extra: object) -> None:
    logger.info("auth.event", extra={"event": event, **extra})


def _require_scopes(token_scopes: Iterable[str], required_scopes: Sequence[str]) -> None:
    missing = [scope for scope in required_scopes if scope not in token_scopes]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Escopos ausentes: {', '.join(missing)}",
        )


async def _authenticate(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> AuthContext:
    if credentials is None:
        _audit("auth.missing", path=str(request.url))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais necessárias")

    claims = _decode_token(credentials.credentials)
    subject = claims.get("sub")
    scopes = claims.get("scopes", []) or []
    issued_at = datetime.fromtimestamp(claims.get("iat", time.time()), tz=timezone.utc)
    if not subject:
        _audit("auth.invalid", path=str(request.url))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sem sujeito")

    rate_key = f"{subject}:{request.url.path}"
    try:
        await limiter.hit(rate_key)
    except RateLimitError:
        _audit("auth.ratelimit", subject=subject, path=str(request.url))
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Limite excedido")

    _audit("auth.success", subject=subject, path=str(request.url))
    return AuthContext(subject=subject, scopes=list(scopes), issued_at=issued_at)


def require_auth(required_scopes: Sequence[str]) -> Depends:
    async def dependency(context: AuthContext = Depends(_authenticate)) -> AuthContext:
        _require_scopes(context.scopes, required_scopes)
        return context

    return Depends(dependency)
