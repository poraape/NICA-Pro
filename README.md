# NICA-Pro Monorepo

Plataforma nutricional full-stack que combina um backend FastAPI e um frontend Next.js 14 para registrar refeições em texto livre, estimar macros/calorias com NLP local e exibir dashboards estilo Apple Health. O monorepo está pronto para conectar-se ao PostgreSQL do Supabase, permitindo evoluir para coaching inteligente e automações futuras.

## Estrutura do repositório
```
nica-pro/
├── backend/            # FastAPI + SQLAlchemy + NLP e coaching
├── frontend/           # Next.js 14 (App Router, Tailwind, shadcn/ui)
└── infra/
    └── supabase/      # DDL, seeds e docs de banco
```

### Componentes em alto nível
- **Backend (FastAPI)** – expõe endpoints REST para onboarding, metas, refeições e resumos, usa SQLAlchemy com UUID e JSONB, aplica NLP heurístico para interpretar refeições e gera insights simples de coaching.
- **Frontend (Next.js)** – PWA em TS com App Router, Tailwind e Recharts. Inclui onboarding guiado, registro diário de refeições e dashboard com anéis alternáveis, gráfico semanal e cards de insights.
- **Infra (Supabase)** – `schema.sql` contém o DDL das tabelas `users`, `user_goals`, `plans`, `meals` e `daily_summaries`, com comentários e índices alinhados ao Postgres gerenciado.

## Backend FastAPI
### Principais dependências
Listadas em `backend/pyproject.toml`, incluem FastAPI, SQLAlchemy, Pydantic e `psycopg2-binary` para conexão com Postgres/Supabase (Python ≥ 3.11).

### Configuração
- Variável obrigatória: `DATABASE_URL`. Sem defini-la, o backend usa SQLite local (`sqlite:///./nica.db`) para facilitar testes rápidos.
- A função `get_current_user` ainda simula autenticação lendo o header `X-User-Id` e buscando o usuário correspondente. Em produção, substitua por integração direta com o Supabase Auth ou outro IdP.
- O módulo NLP (`app/agents/nlp`) carrega uma `food_db.json` local e usa regex/heurísticas para estimar gramas e macros. Os resultados são gravados em `meals.normalized_items` e agregados para resumos.
- O módulo de coaching (`app/agents/coach`) compara consumo vs metas e gera mensagens sobre calorias, proteína, hidratação e consistência semanal.

### Endpoints implementados
| Rota | Descrição |
| --- | --- |
| `POST /api/users` / `GET /api/users/me` | Cria usuário e retorna o usuário autenticado. |
| `GET/PUT /api/goals` | Obtém ou atualiza metas ativas; histórico é mantido através de registros com `effective_from/to`. |
| `POST /api/meals` | Recebe `{ text, meal_time, meal_type?, emotion? }`, executa o pipeline NLP e salva totais e alimentos normalizados. |
| `GET /api/meals?date=YYYY-MM-DD` | Lista refeições do dia filtrado. |
| `GET /api/summary/daily` | Soma macros do dia corrente/filtrado e retorna snapshot de metas. |
| `GET /api/summary/weekly` | Agrega calorias/macros por dia em uma semana (segunda–domingo). |
| `GET /api/summary/insights` | Aplica as regras de coaching com base no dia atual e histórico recente.

## Frontend Next.js 14
### Layout e rotas
- `app/layout.tsx` define o shell com navbar fixa (`components/navbar.tsx`) e aplica o visual iOS-like.
- `app/dashboard/page.tsx` traz os anéis alternáveis (calorias/proteína/hidratação vs calorias/macros), gráfico semanal com Recharts e cards de insights e refeições.
- `app/meals/today/page.tsx` contém formulário para registrar refeições em texto livre com horário.
- `app/onboarding/page.tsx` coleta dados pessoais, objetivos e metas calóricas/proteína, chamando `/api/users` e `/api/goals`.
- `app/page.tsx` redireciona para `/dashboard` para simplificar a experiência inicial.

### Cliente HTTP
`frontend/lib/api.ts` centraliza chamadas REST, usa `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8000`) e lança erros detalhados. Configure `.env.local` no frontend com esse valor apontando para o backend correto.

### Dependências
`package.json` inclui Next.js 14.2, React 18, Tailwind 3.4, Recharts, `tailwind-merge` e tipos TS. Scripts principais: `npm run dev`, `npm run build`, `npm start` e `npm run lint`.

## Infra/Supabase
- `infra/supabase/schema.sql` define todas as tabelas com UUID (via `pgcrypto`), JSONB para dados flexíveis, constraints de integridade e índices para consultas por usuário/dia/semana.
- `infra/supabase/README.md` explica como aplicar o schema com Supabase CLI (`supabase db push --file infra/supabase/schema.sql`) e lista as variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` necessárias para o backend.

## Como rodar localmente
### Pré-requisitos
- Python 3.11+
- Node.js 18+ e npm
- Supabase CLI (opcional, caso queira rodar o Postgres localmente)

### Passo a passo
1. **Configurar o backend**
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -e .
   export DATABASE_URL="sqlite:///./nica.db"  # ou string do Postgres/Supabase
   uvicorn app.main:app --reload --port 8000
   ```
   - Crie um usuário via `POST /api/users` e use o `id` retornado no header `X-User-Id` para chamadas subsequentes.
2. **Configurar o frontend**
   ```bash
   cd frontend
   npm install
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   npm run dev
   ```
   - Abra `http://localhost:3000` e siga o onboarding para cadastrar metas e registrar refeições.

### Testes rápidos
- **Backend**: execute `python -m compileall app` ou adicione `pytest` conforme os testes forem sendo escritos.
- **Frontend**: `npm run lint` garante que o projeto segue as regras do Next.js/TypeScript.

## Deploy e operação
- **Backend**: crie uma imagem com Python 3.11, instale o pacote (`pip install .`), injete `DATABASE_URL`, `SUPABASE_URL` e chaves de API. Rode com `uvicorn` ou `gunicorn -k uvicorn.workers.UvicornWorker`. Habilite migrações/DDL usando o Supabase CLI antes de publicar novas versões.
- **Frontend**: use `npm run build && npm start` em qualquer host Node 18+, ou gere uma build estática (Next.js Output File Tracing) e sirva via Vercel/Netlify.
- **Supabase**: mantenha `infra/supabase/schema.sql` como fonte da verdade. Sempre rode `supabase db diff` antes de alterações e valide RLS/policies para liberar apenas dados do usuário autenticado.

## Boas práticas de evolução
- Centralize variáveis sensíveis em `.env` e jamais as versiona.
- Use seeds em `infra/supabase/seed/` para popular refeições e planos de teste.
- Mantenha as regras do NLP (`food_db.json`) versionadas e considere mover para uma tabela quando a lista crescer.
- Antes de integrar autenticação real, substitua o header manual por validação de JWT do Supabase Auth, reaproveitando o `auth_user_id` em `users`.
- Adicione pipelines de CI para `pytest`, `npm run lint` e validação SQL (`supabase db lint`) garantindo confiabilidade a cada PR.
