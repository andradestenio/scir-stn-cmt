create table if not exists public.app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

revoke all on table public.app_state from anon, authenticated;

comment on table public.app_state is 'Estado integrado do SCIR. Acesso exclusivo pelas funções seguras da Vercel.';
