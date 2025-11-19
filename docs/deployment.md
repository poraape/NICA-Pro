# DevOps e Entrega Contínua

Este guia descreve como automatizar deploys e operar os ambientes **dev/stage/prod** com migrações, seeds, auditorias de segurança e observabilidade habilitadas.

## Pipeline CI/CD
- A pipeline principal (`.github/workflows/ci.yml`) executa lint, formatação, type-check, migrações Alembic+seeds e testes. Somente `main` pode receber merges após sucesso do pipeline.
- O job `security` roda **pip-audit**, **bandit** e `npm audit` (produção, severidade alta) para blocar dependências vulneráveis.
- Falhas em qualquer stage impedem merges na branch principal (gate obrigatório).

## Deploy e automação de banco
- Use o workflow `deploy.yml` (gatilho manual) para promover código por ambiente (`dev`, `stage`, `prod`). Ele aplica migrações + seeds via `python -m src.database.cli migrate-seed --url "$DATABASE_URL"` e valida readiness com `python -m src.database.cli healthcheck`.
- Variáveis por ambiente (armazenar como GitHub Secrets):
  - `DEV_DATABASE_URL`, `STAGE_DATABASE_URL`, `PROD_DATABASE_URL`.
  - `DEV_HEALTHCHECK_URL`, `STAGE_HEALTHCHECK_URL`, `PROD_HEALTHCHECK_URL` (endpoint FastAPI `/healthcheck`).
  - `AUTH_SECRET`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT` (se aplicável).
- Seeds incluem enums de sexo, nível de atividade, objetivos e limites clínicos. São reexecutáveis/idempotentes.

## Provisionamento de ambientes
- **dev**: usar banco PostgreSQL gerenciado (Supabase ou RDS dev) com backups diários automáticos e retenção de 7 dias. Habilitar exporters OTLP para coletar traces/metrics e logs estruturados.
- **stage**: espelhar configurações de prod com mascaramento de dados e backups hora em hora (retenção 7 dias). Feature flags/rollouts devem ser validados aqui.
- **prod**: backups incrementais a cada 15 minutos + full diário (retenção 30 dias) e testes de restauração mensais. Secrets sempre via GitHub Environments/Secrets e nunca em variáveis de repositório.

## Health/ready checks
- API: `GET /healthcheck` deve responder `{status:"ok"}` e expor cabeçalho `x-trace-id` quando presente.
- Banco: `python -m src.database.cli healthcheck --url "$DATABASE_URL"` valida conectividade e presence dos seeds.
- Fila/event bus: monitorar métricas `event_bus.dlq` e `pipeline.retry.count`; valores >0 indicam reprocessamento necessário.

## Observabilidade e auditoria
- Todos os fluxos propagam `trace_id` (API → orquestrador → agentes). Configure exporters OTLP nas VMs/containers dos ambientes para coletar spans e métricas.
- Logs estruturados incluem escopos de segurança (auth, rate-limit) e mensagens clínicas; configure envio para seu SIEM com retenção adequada por ambiente.

## Rollout e change management
- Releases são tagueadas somente após CI e auditorias verdes. Use o template de PR para checklist de segurança/UX.
- Deploys em `prod` devem ser aprovados por 2 revisores e executar o workflow de deploy apontando para os secrets de produção.
- Após deploy, validar healthcheck, dashboards de métricas e ausência de DLQ antes de encerrar a janela.
