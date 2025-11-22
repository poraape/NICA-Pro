from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from api.router import router
from api.security import ensure_auth_configured
from core.logging import configure_logging
from core.orchestrator import get_orchestrator
from core.tracing import TRACE_HEADER, generate_trace_id
from core.telemetry import set_current_trace_id

logger = configure_logging()
get_orchestrator(logger)
ensure_auth_configured()

app = FastAPI(title="NICA-Pro Modular Monolith", version="2.0.0")


def _error_response(message: str, status_code: int, trace_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": message, "trace_id": trace_id},
    )


@app.middleware("http")
async def _attach_trace_id(request: Request, call_next):
    trace_id = request.headers.get(TRACE_HEADER) or generate_trace_id()
    request.state.trace_id = trace_id
    set_current_trace_id(trace_id)
    response = await call_next(request)
    response.headers.setdefault(TRACE_HEADER, trace_id)
    return response

SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; object-src 'none'",
}


@app.middleware("http")
async def _apply_security_headers(request, call_next):
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        if header not in response.headers:
            response.headers[header] = value
    return response


@app.exception_handler(HTTPException)
async def _http_errors(request: Request, exc: HTTPException):
    trace_id = getattr(request.state, "trace_id", generate_trace_id())
    set_current_trace_id(trace_id)
    logger.warning(
        "http_error",
        extra={
            "trace_id": trace_id,
            "status": exc.status_code,
            "detail": exc.detail,
            "path": str(request.url),
        },
    )
    message = exc.detail if exc.detail else "Erro inesperado"
    return _error_response(message, exc.status_code, trace_id)


@app.exception_handler(RequestValidationError)
async def _validation_errors(request: Request, exc: RequestValidationError):
    trace_id = getattr(request.state, "trace_id", generate_trace_id())
    set_current_trace_id(trace_id)
    logger.warning(
        "validation_error",
        extra={"trace_id": trace_id, "errors": exc.errors(), "path": str(request.url)},
    )
    return _error_response("Payload inválido", status.HTTP_422_UNPROCESSABLE_ENTITY, trace_id)


@app.exception_handler(Exception)
async def _unhandled_errors(request: Request, exc: Exception):  # pragma: no cover - crash path
    trace_id = getattr(request.state, "trace_id", generate_trace_id())
    set_current_trace_id(trace_id)
    logger.error(
        "unhandled_error",
        exc_info=exc,
        extra={"trace_id": trace_id, "path": str(request.url)},
    )
    return _error_response("Erro interno do servidor", status.HTTP_500_INTERNAL_SERVER_ERROR, trace_id)

app.include_router(router)


@app.get("/healthcheck")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "nica-pro"}
