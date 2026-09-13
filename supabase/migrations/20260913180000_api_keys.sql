-- Org API keys for A2A / programmatic access. Only the sha256 hash is stored; the key is shown once.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  created_by uuid,
  name text not null,
  key_hash text not null unique,
  prefix text not null,
  revoked boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_org_idx on public.api_keys (org_id);
alter table public.api_keys enable row level security;
drop policy if exists api_keys_members on public.api_keys;
create policy api_keys_members on public.api_keys for select using (public.is_org_member(org_id));
