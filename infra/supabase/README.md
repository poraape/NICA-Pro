# Supabase Schema – NICA-Pro

Este diretório concentra o esquema SQL do projeto e instruções básicas para aplicar o DDL no banco do Supabase.

## Pré-requisitos
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e autenticado (`supabase login`).
- Projeto Supabase já criado (local ou cloud).
- Docker configurado (necessário para `supabase start` em modo local).

## Aplicando o schema
1. Copie o arquivo `infra/supabase/schema.sql` para o diretório raiz do projeto Supabase ou aponte para ele via CLI.
2. Execute `supabase db push --file infra/supabase/schema.sql` para aplicar o DDL em um projeto local ou remoto.
3. Alternativamente, abra o SQL Editor do Supabase, cole o conteúdo do `schema.sql` e execute manualmente.
4. Verifique se as tabelas `users`, `user_goals`, `plans`, `meals` e `daily_summaries` foram criadas e se as extensões necessárias (pgcrypto) estão habilitadas.

## Variáveis de ambiente para o backend
Configure as seguintes variáveis no `.env` do backend (FastAPI) para permitir que a aplicação acesse o banco:

```
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são usados para chamadas HTTP (auth, storage, realtime).
- `DATABASE_URL` é usado pelo SQLAlchemy/psycopg2 para conectar diretamente ao PostgreSQL hospedado.

> **Dica:** mantenha um arquivo `.env.example` com estas variáveis para facilitar o onboarding de novos devs.

## Próximos passos
- Criar seeds (`infra/supabase/seed/`) para dados de teste (planos, refeições dummy, etc.).
- Configurar policies (RLS) no Supabase alinhadas com os endpoints do backend.
