-- Contracts & SLAs: the clauses that turn a delay into money. Parsed from pasted text by the Contracts agent or entered by hand.
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id text not null,
  user_id uuid,
  counterparty text not null,
  kind text not null default 'customer' check (kind in ('customer','supplier','carrier')),
  node_id text,                          -- the site the commitment attaches to (customer DC, supplier plant, carrier lane origin)
  lead_time_commit_days numeric,         -- promised lead time / delivery window
  grace_days numeric not null default 0, -- days of delay before penalties start
  penalty_per_day_usd numeric not null default 0,
  penalty_cap_usd numeric,               -- null = uncapped
  service_level_pct numeric,             -- e.g. 98 (OTIF)
  expires_at date,
  notes text,
  raw_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contracts_chain_idx on public.contracts (supply_chain_id);
alter table public.contracts enable row level security;
drop policy if exists contracts_owner on public.contracts;
create policy contracts_owner on public.contracts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists contracts_org_read on public.contracts;
create policy contracts_org_read on public.contracts for select using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id)));
