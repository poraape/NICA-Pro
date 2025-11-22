# Runbook: Interrupção ou degradação do Postgres

## Sintoma
- API retorna 500/503 com mensagens de pool ou timeout.
- Métricas `db.pool.timeouts`, `db.connection_errors` ou aumento de latência P99.

## Diagnóstico rápido
1. Verifique conectividade via `python -m src.database.cli healthcheck --url "$DATABASE_URL"`.
2. Consulte logs de aplicação para `database_unavailable` e `trace_id` correlacionado.
3. Validar status do servidor (RDS/Supabase) e métricas de CPU/IO.

## Mitigação
- Se indisponível: acionar failover/replica (se disponível) e apontar `DATABASE_URL` para a réplica promotada.
- Reduzir carga aplicando rate-limit temporário via ingress/gateway.
- Aumentar limites de conexão/CPU do banco caso atinja limites provisionados.

## Rollback
- Se um deploy alterou o schema, aplicar `alembic downgrade -1` com o mesmo pacote de versão.
- Reverter `DATABASE_URL` para o endpoint primário após estabilização.

## Pós-incidente
- Agendar testes de restauração a partir de snapshots mais recentes.
- Ajustar pool-size e timeouts no backend se houver saturação recorrente.
