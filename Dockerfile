# Multi-stage build for NICA-Pro backend with optional Hugging Face prefetch
ARG PYTHON_VERSION=3.11

FROM python:${PYTHON_VERSION}-slim AS builder
ENV PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_NO_CACHE_DIR=on
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/pyproject.toml backend/src/ ./backend/
RUN python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir --prefix /install ./backend

FROM python:${PYTHON_VERSION}-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/usr/local/bin:$PATH" \
    PYTHONPATH="/app/backend" \
    HF_HOME="/var/huggingface" \
    HF_HUB_CACHE="/var/huggingface/hub" \
    HF_DATASETS_CACHE="/var/huggingface/datasets" \
    HF_TOKEN_PATH="/run/secrets/huggingface_token"
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY --from=builder /install /usr/local
COPY backend /app/backend
COPY infra/docker/entrypoint.sh /entrypoint.sh
COPY infra/docker/prefetch_models.py /opt/hf/prefetch_models.py
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app /var/huggingface \
    && chmod +x /entrypoint.sh
USER appuser
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
