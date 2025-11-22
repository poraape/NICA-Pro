# Plano de Refatoração Full-Stack — NICA-Pro

## 1. Visão geral e metas
- **Objetivo**: Implementar refatoração incremental e segura para elevar arquitetura, qualidade de código, segurança, observabilidade e UX ao padrão de excelência, preservando comportamento de negócio.
- **Estado atual (síntese da auditoria)**: Persistência in-memory sem durabilidade; desalinhamento de auth entre front/back; observabilidade restrita a console; cobertura de testes concentrada no backend; headers de segurança e acessibilidade incompletos; ausência de IaC/CI documentada.
- **Metas-alvo por dimensão**
  - Arquitetura: Ports & Adapters com repositórios persistentes e event bus pluggable.
  - Código/API: Contratos estáveis, validação ponta-a-ponta e tratamento de erros uniforme.
  - Performance: Cache e pooling para operações críticas; lazy-loading no front.
  - Segurança: JWT alinhado front/back, segredos obrigatórios, hardening de headers e logs sem PII.
  - UX: Acessibilidade WCAG 2.1 AA com ARIA, foco visível e mensagens claras.
  - Testes: Pirâmide saudável (lint+unit+integração+E2E) com cobertura reportada.
  - Dados: Postgres/Supabase com migrações versionadas, índices e backups.
  - Observabilidade: Logging estruturado e tracing OTLP com dashboards e alertas.
  - DevOps: CI/CD com gates, IaC (Compose/K8s) e estratégia de rollback.
  - Documentação: ADRs, diagramas C4/seq, runbooks e política de dependências.

## 2. Roadmap global por fase
- **Quick Wins (<1 semana)**
  - Forçar `AUTH_SECRET` e remover fallback inseguro; alinhar frontend para enviar JWT/escopos e tratar 401/403.
  - Adicionar middleware de security headers (CSP, HSTS, X-Frame-Options) e logging JSON com trace-id.
  - Exportar OTEL via OTLP collector (Jaeger/Tempo) e habilitar correlação de requests.
  - Introduzir validação client-side (Zod/Yup) e mensagens de erro granulares; adicionar ARIA básica e foco visível.
- **Curto Prazo (1-4 semanas)**
  - Implementar repositório Postgres/Supabase com SQLAlchemy + Alembic; ativar pooling e transações.
  - Configurar cache (Redis) para dashboards/consultas derivadas e SWR no front com `next/dynamic` para gráficos pesados.
  - Criar suíte de testes front (Vitest/Testing Library) e E2E (Playwright) com fluxo autenticado; publicar cobertura.
  - Configurar pipeline CI (lint/test/build/coverage/scan) e Compose para dev com healthchecks.
- **Médio Prazo (1-3 meses)**
  - Introduzir Ports & Adapters formais, segregando interfaces de domínio, infraestrutura (DB/filas/cache) e boundary adapters.
  - Adicionar fila/event bus externo para tarefas assíncronas; implementar métricas e SLOs por agente e API.
  - Hardening de acessibilidade (axe, contrastes, aria-live) e internacionalização de mensagens de erro.
  - Runbooks de incidentes, backup/restore e políticas de retenção de dados.
- **Longo Prazo (3+ meses)**
  - Orquestração em K8s com auto-scaling, secrets manager, certificados gerenciados e deploy blue/green.
  - Tracing distribuído full-stack (front/back) e dashboards unificados (Grafana/Tempo/Loki/Sentry).
  - Governança de dados (LGPD): anonimização em logs, DSR workflows e auditoria de acessos.

## 3. Plano por dimensão e camada
### 3.1 Arquitetura e design
- **Problema**: Repositório em memória e acoplamento infra/domínio; event bus apenas in-process.
- **Objetivo**: Arquitetura hexagonal com repositórios persistentes e adapters substituíveis para cache/filas/telemetria.
- **Estratégia**: Introduzir interfaces `Repository`, `EventBus`, `Telemetry` em camada de aplicação; mover implementações concretas para infraestrutura.
- **Ações**: 
  - Criar módulo `backend/src/domain/ports` com interfaces; adaptar orchestrator e serviços para depender de portas.
  - Implementar `PostgresRepository` e `RedisCacheAdapter`; preservar `MemoryRepository` apenas para testes.
  - Documentar boundaries e diagramas (contexto/contêiner/sequência) e registrar ADR para adoção de hexagonal.
- **Riscos/Mitigação**: Mudança de injeção de dependências pode quebrar rotas → criar testes de caracterização e feature flags para seleção de adapter por env.
- **DoD**: Build e testes passam com repositório Postgres ativo; diagrama C4 v1 publicado; adapters selecionáveis via env.

### 3.2 Código backend e APIs
- **Problema**: Falta de validação front-alinhada, tratamento uniforme de erro e contratos centralizados.
- **Objetivo**: APIs consistentes com DTOs, validação simétrica e respostas estruturadas.
- **Estratégia**: Definir esquemas Pydantic de request/response; middleware de erro único; contratos versionados.
- **Ações**:
  - Criar `backend/src/api/schemas` com DTOs e responses padrão (`data`/`error`/`trace_id`).
  - Adicionar middleware para mapear exceções de domínio em HTTP codes previsíveis; padronizar mensagens.
  - Publicar spec OpenAPI atualizada; alinhar frontend via cliente gerado ou camada `api.ts` tipada.
- **Riscos/Mitigação**: Mudança de payload pode quebrar front → versionar rota ou fornecer fallback compatível e testes E2E autenticados.
- **DoD**: OpenAPI atualizada; respostas homogêneas; testes de integração cobrindo 4xx/5xx; cliente front ajustado.

### 3.3 Frontend, UX e performance
- **Problema**: Tokens não enviados; validação/ARIA incompletas; gráficos carregam juntos.
- **Objetivo**: Front seguro, acessível e performático.
- **Estratégia**: Middleware/cliente de API injeta JWT; validação Zod; dynamic imports e SWR; checklist WCAG.
- **Ações**:
  - Ajustar `frontend/src/lib/api.ts` para anexar `Authorization` e tratar 401/403 com refresh/logout; centralizar endpoints e headers.
  - Introduzir schemas Zod para formulários e mensagens de erro por campo; aplicar `aria-*`, foco visível e `aria-live` em toasts.
  - Usar `next/dynamic` nos gráficos e dividir bundles; lazy-load de seções pesadas e otimização de imagens.
  - Adicionar testes Vitest/Testing Library + Playwright cobrindo login/dashboard.
- **Riscos/Mitigação**: Possíveis loops de refresh → usar mutex e limites; regressão de acessibilidade → rodar `@axe-core/react` no CI.
- **DoD**: Chamadas autenticadas; lighthouse/aXe sem issues críticas; métricas de bundle reduzidas; testes front passam.

### 3.4 Banco de dados e persistência
- **Problema**: In-memory sem transações, migrações ou índices; ausência de DR.
- **Objetivo**: Persistência confiável e auditável.
- **Estratégia**: Postgres gerenciado com Alembic, migrations versionadas, índices e políticas de backup.
- **Ações**:
  - Configurar pool SQLAlchemy, transações e locking otimista; criar migrations iniciais e seeds mínimas.
  - Adicionar índices para consultas de dashboard/diário; monitorar planos de execução.
  - Definir rotina de backup/restore (pg_dump) e testar restauração; incluir testes de migração em CI.
- **Riscos/Mitigação**: Migrações podem corromper dados → dry-run em staging, backups antes de aplicar; feature flag para troca de repo.
- **DoD**: Serviço opera em Postgres com migrations aplicadas; backups agendados; testes de integração usando DB real.

### 3.5 Segurança e conformidade
- **Problema**: Segredo de auth com fallback inseguro; front sem token; headers de segurança ausentes; logs podem conter PII.
- **Objetivo**: Hardening alinhado a OWASP e LGPD.
- **Estratégia**: Segredos obrigatórios e rotacionáveis; headers e CSP; limpeza de logs; tokens curtos com refresh opcional.
- **Ações**:
  - Exigir `AUTH_SECRET`/JWKS via env ou secret manager; remover defaults; configurar rotação e expiração curta.
  - Middleware de headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy) e validação de origem/CORS restrito.
  - Sanitizar logs e mascarar PII; revisar payloads e storage local; adicionar CSRF/anti-replay conforme fluxo.
  - Playbooks de gestão de credenciais e checklist LGPD (DSR, consentimento, retenção).
- **Riscos/Mitigação**: Quebra de ambientes dev → prover exemplo via `.env.example` mas sem defaults; CSP bloqueando recursos → modo report-only inicial.
- **DoD**: Sem fallback de segredos; scanners OWASP ZAP sem achados críticos; logs sem PII; CSP efetiva após período de teste.

### 3.6 Testes e qualidade
- **Problema**: Cobertura concentrada no backend; sem métricas; ausência de testes de rede/falha.
- **Objetivo**: Pirâmide robusta com feedback rápido.
- **Estratégia**: Expandir unit/integration, adicionar front/E2E e contratos; publicar cobertura e linting obrigatório.
- **Ações**:
  - Habilitar linters/formatters (ruff/mypy/black para Python; eslint/prettier/tsc para front) no CI.
  - Criar testes de rede adversa (timeouts, 401/403, expirados) e de regressão de orquestração.
  - Integrar cobertura (coverage.py/pytest-cov, c8/Vitest) e gate mínimo.
  - Automatizar testes E2E com Playwright incluindo fluxo autenticado e estados de erro.
- **Riscos/Mitigação**: Aumento de tempo de pipeline → paralelizar jobs e usar caches; flakiness E2E → usar fixtures determinísticas.
- **DoD**: Cobertura publicada; lint/test obrigatórios no CI; E2E estáveis; gates aplicados.

### 3.7 Observabilidade e operação
- **Problema**: Telemetria apenas em console; sem métricas/alertas.
- **Objetivo**: Observabilidade 3 pilares (logs, métricas, traces) integrada.
- **Estratégia**: OTLP export para collector, logging estruturado, métricas técnicas/negócio e dashboards.
- **Ações**:
  - Configurar OTEL exporter (OTLP/HTTP/GRPC) e contexto propagado; instrumentar principais rotas/queries/eventos.
  - Adotar logging JSON com `trace_id`/`user_id`; enviar para Loki/ELK; definir níveis e retenção.
  - Criar métricas (latência, taxa de erro, throughput, fila) e SLOs; alertas acionáveis (p95, erro 5xx, jobs atrasados).
  - Dashboards para agentes, API e front (web vitals) e integração com Sentry para erros de cliente.
- **Riscos/Mitigação**: Sobrecarga de telemetria → sampling/limite de taxas; dados sensíveis em logs → filtros/redaction.
- **DoD**: Traces visíveis em collector; dashboards e alertas ativos; logs estruturados no agregador; SLOs definidos.

### 3.8 Infraestrutura, CI/CD e DevOps
- **Problema**: Sem pipelines declarados nem IaC; healthchecks não padronizados.
- **Objetivo**: Entrega automatizada e infraestrutura reproduzível.
- **Estratégia**: Workflows CI/CD com gates; Compose/K8s manifestos; healthchecks e rollback documentados.
- **Ações**:
  - Criar GitHub Actions (ou similar) para lint/test/build/coverage/scan; publicar artefatos e imagens.
  - Adicionar `docker-compose.dev.yml` e manifests K8s (Deployment/Service/Ingress/Secrets/ConfigMap) com probes e recursos.
  - Definir estratégia de deploy (blue/green ou canary) e rollback; integrar com registry e scanner de imagens.
  - Configurar rate limiting e circuit breakers na borda (NGINX/Envoy) e pooling de conexões.
- **Riscos/Mitigação**: Custo infra em staging → usar ambientes efêmeros; mudanças de pipeline quebrando builds → validar em branch protegida.
- **DoD**: Pipeline verde com gates; manifests versionados; healthchecks atendidos; rollback documentado/testado.

### 3.9 Documentação e governança técnica
- **Problema**: Falta de diagramas, ADRs e runbooks de incidentes; dependências sem matriz.
- **Objetivo**: Governança clara e onboarding rápido.
- **Estratégia**: Documentação viva com ADRs, diagramas e playbooks; políticas de review e atualização.
- **Ações**:
  - Criar ADRs para escolhas (auth, DB, observabilidade, arquitetura hexagonal) e armazenar em `docs/adrs`.
  - Produzir diagramas C4/seq dos fluxos críticos (login, pipeline de agentes, dashboard) e matriz de dependências/versões.
  - Runbooks: incidentes de auth, falhas de DB, vazão lenta, restauração de backup e rotação de segredos.
  - Política de code review, versionamento semântico, renovação de dependências (renovate/depup) e checklist de PR.
- **Riscos/Mitigação**: Documentação desatualizar → owner por documento e revisões trimestrais; over-head de processos → checklists enxutos.
- **DoD**: ADRs publicados; diagramas no repo; runbooks versionados; checklist de PR em uso.

## 4. Ações refinadas (exemplos com passos técnicos)
1) **Ativar persistência Postgres**
   - Passos: (a) adicionar envs `DATABASE_URL` e config de pool; (b) criar migrations Alembic; (c) implementar adapter Postgres; (d) alterar `get_repository` para ler env e injetar adapter; (e) testes de integração com DB real; (f) seeds/dev.
   - Impacto: Durabilidade, consistência e base para escalabilidade.
   - Risco: Migração incompleta → mitigar com backup/dry-run.
   - Aceitação: Migrations aplicam limpas; testes passam; fallback para memória apenas em testes.

2) **Alinhar auth front/back**
   - Passos: (a) cliente API injeta `Authorization`; (b) armazenar/renovar tokens com expiração curta e refresh; (c) tratar 401/403 com logout/controlado; (d) proteger rotas com guards; (e) testes E2E autenticados.
   - Impacto: Elimina falhas de autorização e melhora UX de sessão.
   - Risco: Loops de refresh → usar mutex/backoff.
   - Aceitação: Fluxos protegidos retornam 2xx autenticados; E2E sem 401 inesperado.

3) **Observabilidade OTLP**
   - Passos: (a) configurar exporter OTLP; (b) instrumentar requests/queries/eventos; (c) logging JSON com trace-id; (d) dashboards e alertas; (e) testes de smoke enviando spans.
   - Impacto: Debug e SLOs confiáveis.
   - Risco: Sobrecarga → aplicar sampling e limites.
   - Aceitação: Traces e logs chegam ao collector; alertas ativos.

4) **Acessibilidade e performance de UI**
   - Passos: (a) aplicar `aria-*`, foco visível e `aria-live`; (b) validação Zod; (c) `next/dynamic` para gráficos e lazy-load; (d) testes axe/lighthouse no CI.
   - Impacto: Inclusão, menor carga inicial e menor taxa de erro de formulário.
   - Risco: CSP/ARIA quebrar estilos → revisar em staging.
   - Aceitação: Sem violações axe; bundles reduzidos; testes front passam.

5) **Pipeline CI/CD e IaC**
   - Passos: (a) workflow com lint/test/build/coverage/scan; (b) Compose dev com healthchecks; (c) manifests K8s com probes e recursos; (d) estratégia blue/green; (e) rollback automatizado.
   - Impacto: Entrega confiável e previsível.
   - Risco: Pipelines lentos → cache e paralelismo.
   - Aceitação: Pipeline verde; deploy automatizado com rollback validado.

## 5. Riscos, dependências e mitigação
- Dependência de DB gerenciado e Redis disponíveis; risco de custos em ambientes → usar instâncias pequenas e auto-shutdown.
- Mudança de contratos de API exige coordenação front/back → versionar rotas e manter compatibilidade temporária.
- Telemetria pode expor PII → aplicar filtros/redaction e revisão de campos.
- E2E podem ser flakey → fixtures determinísticas e retry limitado.

## 6. Indicadores e métricas de sucesso
- **Qualidade**: Cobertura backend/front (>80%), densidade de lint issues tendendo a zero, tempo médio de code review.
- **Performance**: p95 API < 300ms em rotas críticas; TTFB/LCP < 2.5s; erro 5xx < 1%.
- **Segurança**: Zero fallbacks de segredo; CSP/HSTS ativos; ZAP/DAST sem achados críticos.
- **Confiabilidade**: Taxa de sucesso de deploy > 95%, rollback automatizado < 10 min, incidents MTTR < 30 min.
- **Observabilidade**: 100% das rotas com trace-id; dashboards e alertas ativos; SLOs definidos e monitorados.
- **UX**: Sem violações axe críticas; taxa de erro de formulário < 2%; estabilidade CLS < 0.1.

## 7. Status de execução (iterativo)
- ✅ Segredo de autenticação obrigatório e validação de startup.
- ✅ Middleware de headers de segurança e logging JSON com `trace_id` correlacionado.
- ✅ Atribuição centralizada de `trace_id` por requisição e respostas de erro padronizadas com rastreabilidade.
- ✅ Exportar OTEL para collector e enriquecer métricas/alertas.
- ✅ Implementar repositórios Postgres/Redis com Alembic, pooling e cache Redis (fallback SQLite apenas para testes).
- ✅ Padronizar DTOs de API, contratos OpenAPI e cliente front gerado.
- 🟡 Introduzir validação Zod/ARIA no front (concluído); testes Vitest/Playwright e carregamento dinâmico de gráficos pendentes.
- 🟡 Configurar CI/CD com gates (lint/test/build/scan) e Compose/K8s com healthchecks (CI e Compose entregues; CD/K8s pendente).
- 🟡 Publicar ADRs, diagramas C4 e runbooks de incidentes/segurança (ADR + runbook de persistência publicados; diagramas/runbooks adicionais pendentes).
