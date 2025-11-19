# Runbook Operacional

1. **Saúde e readiness**
   - `GET /healthcheck` deve retornar `{status:"ok"}`.
   - Verifique métricas `event_bus.dlq` e `agent.invocations` (ConsoleMetricExporter) para detectar erros ou quedas de throughput.
2. **Incidentes e latência**
   - Use o `trace_id` retornado em cada resposta para recuperar spans de orquestração. Spans são nomeados `api.*` e `pipeline.*`.
   - Falhas persistentes na fila aparecem no DLQ (`event.dlq`). Drene e reprocesse com inspeção manual do payload.
3. **Segurança e auditoria**
   - Eventos de autenticação são logados como `auth.event` e incluem caminho da requisição e `trace_id` quando presente.
   - Tokens devem ser gerados com `AUTH_SECRET`; escopos obrigatórios: `plan:write`, `diary:write`, `dashboard:read`.
   - Auditorias automáticas: `pip-audit`, `bandit` e `npm audit` rodam na CI. Corrija vulnerabilidades antes do merge em `main`.
4. **Rollout e change management**
   - Use o template de PR com checklist de segurança/UX.
   - A pipeline CI (lint, testes, tipo, migrações, segurança) precisa estar verde antes do merge. Releases devem ser taggeadas após aprovação dupla.
   - Para deploy, acione o workflow `Deploy` via `workflow_dispatch`, escolhendo `dev`, `stage` ou `prod`; ele executa migrações, seeds e healthcheck.
