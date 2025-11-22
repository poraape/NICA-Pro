# ADR 0001 — Persistência durável com Postgres e cache Redis

## Contexto
- Persistência anterior era in-memory/SQLite, sem durabilidade ou cache.
- Roadmap pedia Postgres/Supabase com pooling, migrações e cache Redis para reduzir recomputação de dashboards.

## Decisão
- Adotar Postgres como backend padrão, configurado via `DATABASE_URL` com Alembic/Migrations já versionadas.
- Introduzir `REDIS_URL` e cache de dashboards em Redis com TTL configurável (`CACHE_TTL_SECONDS`, default 300s).
- Manter `MemoryRepository`/SQLite apenas para testes locais rápidos (`DATABASE_URL=sqlite+...`).
- `start-dev.sh` e `docker-compose.dev.yml` sobem Postgres e Redis automaticamente para dev.

## Consequências
- Dashboards reutilizam o último snapshot enquanto novos logs/planos invalidam o cache.
- Requer serviços Redis/Postgres locais ou provisionados em CI/staging; conexão é lazy para não quebrar smoke tests sem Redis.
- Seeds e migrações continuam através de `python -m database.cli migrate-seed`.
