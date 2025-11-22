# Runbook: Vazão lenta ou quedas de performance

## Sintoma
- Tempo de resposta do dashboard aumenta ou filas de cache expiram.
- Alertas em `http.server.duration.p95`, `cache.miss.rate` ou `redis.connection.errors`.

## Diagnóstico rápido
1. Usar traces OTEL para identificar spans lentos (repositório, cache, chamadas externas).
2. Avaliar métricas de Redis (latência, hit/miss, conexões ativas) e Postgres (locks, slow queries).
3. Confirmar quantidade de réplicas e throttling em HPA (ver `kubectl describe hpa nica-backend`).

## Mitigação
- Invalidar cache corrompido: `FLUSHDB` no namespace de dashboard se seguro.
- Aumentar réplicas via HPA (`kubectl scale deployment nica-backend --replicas=4`).
- Ativar temporariamente `CACHE_DISABLED=true` para isolar problemas de Redis e focar em banco.

## Rollback
- Se a última release causou o problema, usar `kubectl rollout undo deployment/nica-backend` e monitorar.
- Reverter ajustes de escala após estabilizar para evitar custos excessivos.

## Pós-incidente
- Criar alerta para picos de cache miss e latência de banco.
- Priorizar profiling na rota degradada e otimizações de consulta/índices.
