-- NICA-Pro Supabase schema
-- Enables UUID generation compatible with Supabase/PostgreSQL
create extension if not exists "pgcrypto";

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid unique not null,
    email text unique not null,
    full_name text,
    timezone text default 'UTC',
    onboarding_completed boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.users is 'Perfil básico e mapeamento para o usuário autenticado no Supabase Auth.';
comment on column public.users.auth_user_id is 'UUID do usuário no Supabase Auth.';
comment on column public.users.metadata is 'Configurações adicionais como preferências alimentares ou restrições.';

create table if not exists public.user_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    calories_target integer not null check (calories_target > 0),
    protein_target numeric(10,2) check (protein_target >= 0),
    carbs_target numeric(10,2) check (carbs_target >= 0),
    fat_target numeric(10,2) check (fat_target >= 0),
    hydration_target numeric(10,2) check (hydration_target >= 0),
    active boolean not null default true,
    effective_from date not null,
    effective_to date,
    created_at timestamptz not null default now()
);

comment on table public.user_goals is 'Metas nutricionais configuráveis por usuário. Mantém histórico por intervalo de vigência.';

create table if not exists public.plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    week_start date not null,
    template jsonb not null,
    notes text,
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, week_start)
);

comment on table public.plans is 'Plano alimentar semanal armazenado como JSON (estrutura por dia/refeição).';

create table if not exists public.meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    plan_id uuid references public.plans(id) on delete set null,
    meal_time timestamptz not null,
    meal_type text,
    source text not null default 'user_entry' check (source in ('user_entry', 'plan_generated', 'imported', 'corrected')),
    raw_input text,
    normalized_items jsonb not null default '[]'::jsonb,
    calories numeric(10,2) check (calories >= 0),
    protein numeric(10,2) check (protein >= 0),
    carbs numeric(10,2) check (carbs >= 0),
    fat numeric(10,2) check (fat >= 0),
    hydration numeric(10,2) check (hydration >= 0),
    inference_metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.meals is 'Registros de refeições inseridos pelo usuário ou gerados pelo plano.';
comment on column public.meals.normalized_items is 'Itens interpretados pelo NLP, incluindo peso, kcal e macros.';
comment on column public.meals.inference_metadata is 'Logs do processamento NLP, confidence scores, etc.';

create table if not exists public.daily_summaries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    summary_date date not null,
    calories_total numeric(10,2) not null default 0,
    protein_total numeric(10,2) not null default 0,
    carbs_total numeric(10,2) not null default 0,
    fat_total numeric(10,2) not null default 0,
    hydration_total numeric(10,2) not null default 0,
    plan_snapshot jsonb,
    recalculation_scope text check (recalculation_scope in ('day', 'week')),
    recalculated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, summary_date)
);

comment on table public.daily_summaries is 'Agrega macros e calorias por usuário/dia para exibir no dashboard.';
comment on column public.daily_summaries.plan_snapshot is 'Cópia do plano vigente usada como referência para o dia.';

create index if not exists idx_user_goals_user_active on public.user_goals(user_id) where active;
create index if not exists idx_plans_user_week on public.plans(user_id, week_start);
create index if not exists idx_meals_user_time on public.meals(user_id, meal_time);
create index if not exists idx_daily_summaries_user_date on public.daily_summaries(user_id, summary_date);
