-- Response playbooks: what the org does when a category of disruption hits. Built-ins are installed (copied) per org and edited freely.
create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  created_by uuid,
  key text not null,                     -- builtin key (port_closure…) or custom slug
  name text not null,
  category text not null check (category in ('GEOPOLITICAL','WEATHER','LOGISTICS','SUPPLIER','MARKET','OTHER')),
  triggers text[] not null default '{}', -- keywords that make this playbook apply (matched against the event title/summary)
  steps jsonb not null default '[]',     -- [{title, owner, due_in_days, detail}]
  guidance text,                         -- free text the Strategist must honour (e.g. "never air-freight hazmat")
  source text not null default 'custom' check (source in ('builtin','custom')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists playbooks_org_key_idx on public.playbooks (org_id, key);
alter table public.playbooks enable row level security;
drop policy if exists playbooks_members on public.playbooks;
create policy playbooks_members on public.playbooks for select using (public.is_org_member(org_id));
