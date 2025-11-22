# DevOps e Entrega Contínua

Este guia descreve como automatizar deploys e operar os ambientes **dev/stage/prod** com migrações, seeds, auditorias de segurança e observabilidade habilitadas.

## Pipeline CI/CD
- A pipeline principal (`.github/workflows/ci.yml`) executa lint, formatação, type-check, migrações Alembic+seeds e testes. Somente `main` pode receber merges após sucesso do pipeline.
- O job `security` roda **pip-audit**, **bandit** e `npm audit` (produção, severidade alta) para blocar dependências vulneráveis.
- Falhas em qualquer stage impedem merges na branch principal (gate obrigatório).
- O workflow `deploy.yml` (gatilho manual) agora inclui build/push das imagens backend e frontend, aplica manifests Kubernetes e valida rollout com rollback automático em caso de falha.

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

## Kubernetes
- Manifests em `infra/k8s` cobrem Deployments + HPA, Services e probes de liveness/readiness.
- Secrets necessários: `auth_secret`, `database_url`, `redis_url`, `otel_exporter_otlp_endpoint`, `api_base_url` (frontend).
- Rollout: `kubectl rollout status deployment/nica-backend` e `kubectl rollout status deployment/nica-frontend` (rollback automático via workflow se falhar).

## Observabilidade e auditoria
- Todos os fluxos propagam `trace_id` (API → orquestrador → agentes). Configure exporters OTLP nas VMs/containers dos ambientes para coletar spans e métricas.
- Logs estruturados incluem escopos de segurança (auth, rate-limit) e mensagens clínicas; configure envio para seu SIEM com retenção adequada por ambiente.

## Rollout e change management
- Releases são tagueadas somente após CI e auditorias verdes. Use o template de PR para checklist de segurança/UX.
- Deploys em `prod` devem ser aprovados por 2 revisores e executar o workflow de deploy apontando para os secrets de produção.
- Após deploy, validar healthcheck, dashboards de métricas e ausência de DLQ antes de encerrar a janela.

## Imagens containerizadas e Hugging Face
- O `Dockerfile` na raiz gera a imagem oficial do backend com build multi-stage, usuário sem privilégios e cache de modelos em `/var/huggingface`. Use `PYTHON_VERSION` como argumento para padronizar a base.
- Para ambientes que exigem download prévio de modelos, defina `HF_MODEL_REPOS` e `HF_REVISION` e monte o token via secret (`/run/secrets/huggingface_token`). O script `infra/docker/prefetch_models.py` garante que os snapshots sejam baixados antes do start.
- O `docker-compose.deploy.yml` em `infra/docker/` sobe Postgres, backend e volume dedicado `hf-cache`; injete variáveis com `stack.env` (não versionado em produção) e mantenha `huggingface_token.txt` fora do controle de versão.
