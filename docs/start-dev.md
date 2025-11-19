# start-dev.sh – inicialização integrada do stack

O script `./start-dev.sh` inicia o Postgres/Supabase, aplica migrações e seeds, e sobe backend FastAPI + frontend Next.js com verificações automáticas. Ele foi pensado para um boot reprodutível, sem depender de passos manuais fora do repositório.

## Visão geral e ordem de boot
1. **Pré-checagens**: valida presença de `python3`, `node`, `npm`, `nc`, `curl` e, conforme o modo, `docker` ou `supabase` CLI.
2. **Banco de dados** (prioridade decrescente):
   - `USE_SUPABASE=true` → inicia Supabase local (`supabase start --exclude analytics`) e usa `postgresql://postgres:postgres@localhost:54322/postgres`.
   - `USE_SQLITE=true` → usa SQLite (`sqlite+pysqlite://…/backend/nica.db`).
   - Padrão → sobe Postgres via Docker (`nica-pro-postgres-dev`, porta 5432) com volume persistente em `.devdata/postgres`.
3. **Ambiente Python**: cria venv em `.venv`, instala `backend` em modo editável com extras `dev`, exporta `PYTHONPATH` e roda `python -m database.cli migrate-seed` para garantir schema e dados de referência.
4. **Frontend**: instala dependências (`frontend/node_modules`) se ausentes.
5. **Serviços de aplicação**: inicia `uvicorn app.main:app` (porta 8000 por padrão) com healthcheck automático e, depois, `npm run dev` do Next.js (porta 3000 por padrão).
6. **Telemetria e segurança**: propaga `AUTH_SECRET`, `RATE_LIMIT`, `NEXT_PUBLIC_API_URL` e `DATABASE_URL` para os processos, preservando os controles já implementados na API.
7. **Encerramento seguro**: `trap` encerra backend, frontend e o Postgres dev (quando for o container interno) ao receber Ctrl+C ou sinais de saída.

## Variáveis de ambiente suportadas
- `USE_SUPABASE` (default `false`): liga Supabase local em vez do Postgres dockerizado.
- `USE_SQLITE` (default `false`): força SQLite local (ignora Docker/Supabase).
- `DATABASE_URL`: string de conexão. Se omitida, usa Postgres local (`postgresql://nica:nica@localhost:5432/nica`) ou o DSN do modo Supabase.
- `POSTGRES_PORT` (default `5432`): porta exposta do Postgres dockerizado.
- `BACKEND_PORT` / `FRONTEND_PORT` (defaults `8000` / `3000`).
- `NEXT_PUBLIC_API_URL` (default `http://localhost:${BACKEND_PORT}`): endereço consumido pelo frontend.
- `AUTH_SECRET` / `RATE_LIMIT`: secret e limite usados pela camada de segurança da API.

## Como usar
```bash
# Postgres dockerizado padrão
./start-dev.sh

# Usando Supabase local (supabase CLI precisa estar instalada)
USE_SUPABASE=true ./start-dev.sh

# Forçando SQLite (sem dependências externas)
USE_SQLITE=true ./start-dev.sh
```

Durante a execução, os logs ficam em `.devlogs/backend.log` e `.devlogs/frontend.log`. Use `tail -f .devlogs/backend.log` para acompanhar o healthcheck, migrações e chamadas de API.

## Fluxo seguro para contribuição
1. Copie um `.env` local com `AUTH_SECRET`, `RATE_LIMIT` e, se necessário, `DATABASE_URL` customizada.
2. Rode `./start-dev.sh` e espere a mensagem de prontidão dos serviços.
3. Crie usuários/metas via frontend ou diretamente na API (JWT/scopes já são exigidos conforme a rota).
4. Ao finalizar, pressione `Ctrl+C`; o script derruba os processos e o container Postgres interno, preservando os dados no volume `.devdata/postgres`.
