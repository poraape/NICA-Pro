# NICA-Pro Monorepo

**NICA-Pro** é um laboratório open source de nutrição inteligente que combina visão de produto, engenharia robusta e experiência premium para **coletar dados alimentares em linguagem natural, transformar em métricas clínicas e entregar coaching personalizado**. O repositório unifica backend, frontend e infraestrutura para acelerar testes, POCs e rollouts em cenários reais, mantendo disciplina de arquitetura, segurança e observabilidade.

## Visão e propósito
- **Por que existe?** Democratizar acompanhamento nutricional baseado em texto livre, permitindo que qualquer time aproveite NLP local, regras clínicas e dashboards responsivos sem depender de vendors fechados.
- **Qual problema resolve?** Reduz a fricção de registrar refeições, normaliza dados em estruturas clínicas (IMC, PA, sódio, alergias) e retorna feedback contextualizado em minutos, **diminuindo o tempo entre captura, análise e ação**.
- **O que o torna diferente?** Uma cadeia multiagente idempotente (ingestão → cálculo → tendências → coaching → dashboard) com **trace_id de ponta a ponta**, limites clínicos versionados e seeds reprodutíveis, pronta para Postgres/Supabase ou SQLite, além de UX inspirada em iOS com acessibilidade completa.

## Arquitetura conceitual
- **Domínio nutricional explícito**: entidades e value objects para perfis, diários, planos e alertas clínicos, servidos por repositórios tipados e contratos claros.
- **Orquestração resiliente**: pipeline assíncrono com retries/DLQ e versionamento de payload para garantir idempotência e rastreabilidade clínica.
- **Observabilidade nativa**: correlação de requisições, métricas por agente, logs estruturados e telemetria configurável via OpenTelemetry.
- **Camada de segurança ativa**: autenticação JWT/Supabase Auth, escopos por operação, rate limiting e validação rigorosa de enums/faixas clínicas.
- **Frontend reativo**: Next.js 14 (App Router) com store global, drafts persistidos, toasts e skeletons, rotas profundas para histórico e alertas, além de **tema adaptativo, glassmorphism leve e microinterações acessíveis**.

## Principais diferenciais técnicos
- **Eficiência e escalabilidade**: SQLAlchemy com transações, locking otimista e seeds mínimas; supabase/Postgres dockerizável via `start-dev.sh` ou fallback para SQLite.
- **Governança e qualidade**: PR templates, linters/formatadores (ruff/black/mypy, eslint/prettier), testes de agentes e API (>80% alvo) e pipelines CI/CD com migrações, SAST e healthchecks.
- **Valor prático imediato**: scripts de bootstrap, documentação operacional e runbooks, permitindo onboarding rápido sem abrir mão de padrões de produção.

## Estrutura do repositório
```
nica-pro/
├── backend/            # FastAPI + SQLAlchemy + domínio e orquestração multiagente
├── frontend/           # Next.js 14 (App Router, Tailwind, shadcn/ui, Recharts)
└── infra/
    └── supabase/      # DDL, seeds e docs de banco
```

### Componentes em alto nível
- **Backend (FastAPI)** – expositor de APIs seguras (JWT/escopos/rate limit), pipeline de ingestão → cálculo → tendências → coaching → dashboards, telemetria ativa e contratos de repositório pluggáveis.
- **Frontend (Next.js)** – PWA TypeScript com navegação profunda, formulários reais de perfil/diário, toasts, skeletons e **tokens de design responsivos** para uma experiência fluida e acessível.
- **Infra (Supabase/Postgres)** – DDL versionado, migrações Alembic, seeds de limites clínicos e scripts de healthcheck/seed para ambientes dev/stage/prod.

## Como rodar localmente
### Pré-requisitos
- Python 3.11+
- Node.js 18+ e npm
- Docker + Docker Compose (para Postgres ou Supabase opcionais)

### Passo a passo
1. **Inicialização integrada (recomendado)**
   - Rode `./start-dev.sh` na raiz: ele sobe Postgres dockerizado (ou Supabase/SQLite, conforme flags), aplica migrações + seeds e inicia backend (8000) e frontend (3000) com healthchecks e logs em `.devlogs/`. Leia `docs/start-dev.md` para ver todas as variáveis e modos (`USE_SUPABASE`, `USE_SQLITE`, `BACKEND_PORT`, `FRONTEND_PORT`, etc.).
2. **Configuração manual** (caso prefira controlar cada serviço)
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -e .
   export DATABASE_URL="sqlite:///./nica.db"  # ou string do Postgres/Supabase
   uvicorn app.main:app --reload --port 8000
   ```
   - Crie um usuário via `POST /api/users` e use o `id` retornado no header `X-User-Id` para chamadas subsequentes.
   ```bash
   cd frontend
   npm install
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   npm run dev
   ```
   - Abra `http://localhost:3000` e siga o onboarding para cadastrar metas e registrar refeições.

### Testes rápidos
- **Backend**: `pytest backend/tests` cobre agentes, orquestração, API e migrações.
- **Frontend**: `npm run lint` garante conformidade com o App Router e padrões de acessibilidade/TypeScript.

## Deploy e operação
- **Backend**: construa uma imagem Python 3.11, instale o pacote (`pip install .`), configure `DATABASE_URL`, `SUPABASE_URL` e chaves de API. Rode com `uvicorn` ou `gunicorn -k uvicorn.workers.UvicornWorker`. As migrações e seeds podem ser executadas via `start-dev.sh` ou `python -m database.cli` em pipelines.
- **Frontend**: `npm run build && npm start` em hosts Node 18+ ou deploy em Vercel/Netlify. O build está alinhado ao Next.js Output File Tracing.
- **Supabase/Postgres**: mantenha `infra/supabase/schema.sql` e as migrações como fonte da verdade. Valide RLS/policies e habilite backups automáticos nos ambientes gerenciados.

## Boas práticas de evolução
- **Segurança e dados**: centralize segredos em `.env`, habilite TLS e revisões de escopo/JWT. Adote RLS para isolar usuários.
- **Qualidade contínua**: mantenha linters/formatadores e tipos como gates obrigatórios; revise contratos JSON e limites clínicos versionados.
- **Escalabilidade**: use a fila/event bus embutidos para workload assíncrono e monitore métricas por agente; adicione novas fontes de ingestão mantendo a idempotência.
- **Experiência de produto**: evolua o coaching com modelos mais ricos de tendência e amplie tokens de design para novas plataformas (mobile, desktop) mantendo a **estética lisa e acessível**.
