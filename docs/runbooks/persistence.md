# Runbook — Persistência (Postgres + Redis)

## Provisionar localmente
- Use `./start-dev.sh` (default) ou `docker-compose -f docker-compose.dev.yml up -d postgres redis`.
- Variáveis principais: `DATABASE_URL=postgresql://nica:nica@localhost:5432/nica`, `REDIS_URL=redis://localhost:6379/0`, `AUTH_SECRET`.
- Para SQLite rápido em testes isolados: `USE_SQLITE=true ./start-dev.sh`.

## Migrações e seeds
- Aplicar e semear: `DATABASE_URL=$URL PYTHONPATH=backend/src python -m database.cli migrate-seed`.
- Healthcheck: `python -m database.cli healthcheck --url $DATABASE_URL`.
- CI usa SQLite in-memory para rapidez (`DATABASE_URL=sqlite+pysqlite:///:memory:`).

## Cache Redis de dashboards
- TTL configurável via `CACHE_TTL_SECONDS` (default 300s). Stale após novo plano/diário → invalidado automaticamente.
- Para limpar manualmente: `redis-cli -u $REDIS_URL FLUSHDB` (dev) ou `DEL dashboard:<user>`.
- Sem `REDIS_URL`, cache é desabilitado e app segue funcional.

## Backup e restauração (dev)
- Backup rápido: `pg_dump $DATABASE_URL > backup.sql`.
- Restauração: `psql $DATABASE_URL < backup.sql`.
