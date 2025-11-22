#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.devlogs"
VENV_DIR="$ROOT_DIR/.venv"
POSTGRES_DATA_DIR="${POSTGRES_DATA_DIR:-$HOME/.nica-pro/postgres}"
POSTGRES_CONTAINER="nica-pro-postgres-dev"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
REDIS_CONTAINER="nica-pro-redis-dev"
REDIS_PORT="${REDIS_PORT:-6379}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
USE_SUPABASE="${USE_SUPABASE:-false}"
USE_SQLITE="${USE_SQLITE:-false}"
USE_REDIS="${USE_REDIS:-true}"
DATABASE_URL="${DATABASE_URL:-postgresql://nica:nica@localhost:${POSTGRES_PORT}/nica}"
REDIS_URL="${REDIS_URL:-redis://localhost:${REDIS_PORT}/0}"
NEXT_PUBLIC_API_URL_DEFAULT="http://localhost:${BACKEND_PORT}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${NEXT_PUBLIC_API_URL_DEFAULT}}"
AUTH_SECRET="${AUTH_SECRET:-}"
RATE_LIMIT="${RATE_LIMIT:-30}"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -Iseconds)] $*"
}

if [[ -z "$AUTH_SECRET" ]]; then
  log "Erro: defina AUTH_SECRET com uma chave aleatória de pelo menos 16 caracteres (ex.: openssl rand -hex 32)"
  exit 1
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Erro: comando obrigatório '$1' não encontrado"
    exit 1
  fi
}

cleanup() {
  log "Encerrando serviços de desenvolvimento..."
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ "${USE_REDIS}" == "true" ]]; then
    if docker ps -a --format '{{.Names}}' | grep -Eq "^${REDIS_CONTAINER}$"; then
      docker stop "$REDIS_CONTAINER" >/dev/null || true
    fi
  fi
  if [[ "${USE_SUPABASE}" == "false" && "${USE_SQLITE}" == "false" ]]; then
    if docker ps -a --format '{{.Names}}' | grep -Eq "^${POSTGRES_CONTAINER}$"; then
      docker stop "$POSTGRES_CONTAINER" >/dev/null || true
    fi
  fi
}

trap cleanup EXIT

ensure_python() {
  require_cmd python3
  if [[ -d "$VENV_DIR" && ! -f "$VENV_DIR/bin/activate" ]]; then
    log "Venv em $VENV_DIR parece incompleta; removendo e recriando"
    rm -rf "$VENV_DIR"
  fi

  if [[ ! -f "$VENV_DIR/bin/activate" ]]; then
    log "Criando venv Python em $VENV_DIR"
    if ! python3 -m venv "$VENV_DIR"; then
      log "Falha ao criar venv (talvez python3-venv não esteja instalado)."
      log "No Ubuntu, tente: sudo apt-get install -y python3.12-venv"
      log "Depois, execute novamente ./start-dev.sh"
      exit 1
    fi
  fi
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  log "Instalando dependências do backend (editable)"
  pip install -q -e "$ROOT_DIR/backend"[dev]
}

ensure_node() {
  # Carrega nvm se node não estiver no PATH (shell não interativo não lê .bashrc)
  if ! command -v node >/dev/null 2>&1; then
    if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
      # shellcheck disable=SC1090
      . "$HOME/.nvm/nvm.sh"
      nvm use --silent default >/dev/null 2>&1 || true
    fi
  fi
  require_cmd node
  require_cmd npm
  if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
    log "Instalando dependências do frontend"
    (cd "$ROOT_DIR/frontend" && npm install >/dev/null)
  fi
}

wait_for_port() {
  local host=$1
  local port=$2
  local label=$3
  for _ in {1..40}; do
    if nc -z "$host" "$port" >/dev/null 2>&1; then
      log "$label disponível em ${host}:${port}"
      return 0
    fi
    sleep 1
  done
  log "Timeout ao aguardar $label em ${host}:${port}"
  exit 1
}

start_sqlite() {
  DATABASE_URL="sqlite+pysqlite://${ROOT_DIR}/backend/nica.db"
  log "Usando SQLite local em $DATABASE_URL"
}

start_postgres() {
  require_cmd docker
  if docker ps --format '{{.Names}}' | grep -Eq "^${POSTGRES_CONTAINER}$"; then
    log "Postgres dev já está em execução"
  else
    mkdir -p "$POSTGRES_DATA_DIR"
    log "Subindo Postgres dev container (${POSTGRES_CONTAINER})"
    docker run -d --rm \
      --name "$POSTGRES_CONTAINER" \
      -e POSTGRES_USER=nica \
      -e POSTGRES_PASSWORD=nica \
      -e POSTGRES_DB=nica \
      -p "${POSTGRES_PORT}:5432" \
      -v "$POSTGRES_DATA_DIR:/var/lib/postgresql/data" \
      postgres:15-alpine >/dev/null
  fi
  wait_for_port localhost "$POSTGRES_PORT" "Postgres"
}

start_redis() {
  if [[ "${USE_REDIS}" != "true" ]]; then
    log "Redis desabilitado via USE_REDIS=false"
    return
  fi
  require_cmd docker
  if docker ps --format '{{.Names}}' | grep -Eq "^${REDIS_CONTAINER}$"; then
    log "Redis dev já está em execução"
  else
    log "Subindo Redis dev container (${REDIS_CONTAINER})"
    docker run -d --rm \
      --name "$REDIS_CONTAINER" \
      -p "${REDIS_PORT}:6379" \
      redis:7-alpine >/dev/null
  fi
  wait_for_port localhost "$REDIS_PORT" "Redis"
}

start_supabase() {
  require_cmd supabase
  if ! supabase status >/dev/null 2>&1; then
    log "Inicializando Supabase local (pode demorar na primeira vez)"
    supabase start --exclude analytics >/dev/null
  else
    log "Supabase já iniciado"
  fi
  DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:54322/postgres}"
  wait_for_port localhost 54322 "Supabase Postgres"
}

migrate_and_seed() {
  log "Aplicando migrações e seeds"
  (cd "$ROOT_DIR/backend" && \
    DATABASE_URL="$DATABASE_URL" PYTHONPATH="$ROOT_DIR/backend/src" \
    python -m database.cli migrate-seed)
}

start_backend() {
  log "Iniciando backend FastAPI na porta ${BACKEND_PORT}"
  (cd "$ROOT_DIR/backend" && \
    DATABASE_URL="$DATABASE_URL" \
    REDIS_URL="$REDIS_URL" \
    AUTH_SECRET="$AUTH_SECRET" \
    RATE_LIMIT="$RATE_LIMIT" \
    PYTHONPATH="$ROOT_DIR/backend/src" \
    uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload \
      >"$LOG_DIR/backend.log" 2>&1) &
  BACKEND_PID=$!
  for _ in {1..30}; do
    if curl -fs "http://localhost:${BACKEND_PORT}/healthcheck" >/dev/null 2>&1; then
      log "Backend pronto em http://localhost:${BACKEND_PORT}"
      return 0
    fi
    sleep 1
  done
  log "Backend não respondeu ao healthcheck"
  exit 1
}

start_frontend() {
  log "Iniciando frontend Next.js na porta ${FRONTEND_PORT}"
  (cd "$ROOT_DIR/frontend" && \
    NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    npm run dev -- --hostname 0.0.0.0 --port "$FRONTEND_PORT" \
      >"$LOG_DIR/frontend.log" 2>&1) &
  FRONTEND_PID=$!
  log "Frontend disponível em http://localhost:${FRONTEND_PORT} (inicialização pode levar alguns segundos)"
}

main() {
  require_cmd nc
  require_cmd curl

  if [[ "$USE_SQLITE" == "true" ]]; then
    start_sqlite
  elif [[ "$USE_SUPABASE" == "true" ]]; then
    start_supabase
  else
    start_postgres
  fi

  start_redis

  ensure_python
  ensure_node
  migrate_and_seed
  start_backend
  start_frontend

  log "Ambiente iniciado. Logs em ${LOG_DIR}. Pressione Ctrl+C para encerrar."
  wait
}

main "$@"
