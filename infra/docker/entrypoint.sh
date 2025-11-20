#!/usr/bin/env bash
set -euo pipefail

if [[ "${RUN_DB_MIGRATIONS:-0}" == "1" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL must be set when RUN_DB_MIGRATIONS=1" >&2
    exit 1
  fi
  python -m src.database.cli migrate-seed --url "${DATABASE_URL}"
fi

if [[ -n "${HF_MODEL_REPOS:-}" ]]; then
  echo "Prefetching Hugging Face models: ${HF_MODEL_REPOS}"
  python /opt/hf/prefetch_models.py
else
  echo "Skipping Hugging Face prefetch (HF_MODEL_REPOS not provided)"
fi

echo "Starting application..."
exec "$@"
