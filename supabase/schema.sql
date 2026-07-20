create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  username text not null unique,
  email text not null unique,
  perfil text not null default 'USUARIO' check (perfil in ('ADMIN','USUARIO')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_app_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_app_state enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.perfil = 'ADMIN' and p.ativo
  )
);

create policy "state_select_own"
on public.user_app_state for select to authenticated
using (user_id = auth.uid());

create policy "state_insert_own"
on public.user_app_state for insert to authenticated
with check (user_id = auth.uid());

create policy "state_update_own"
on public.user_app_state for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "state_delete_own"
on public.user_app_state for delete to authenticated
using (user_id = auth.uid());

create policy "audit_select_admin"
on public.audit_logs for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.perfil = 'ADMIN' and p.ativo
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, username, email, perfil, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil','USUARIO'),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.user_app_state;
