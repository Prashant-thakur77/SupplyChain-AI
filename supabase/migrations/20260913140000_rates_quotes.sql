-- Org rate cards (planning estimates per mode) and carrier quotes (real lane prices that override estimates).
create table if not exists public.rate_cards (
  org_id uuid references public.orgs(id) on delete cascade,
  mode text not null check (mode in ('sea','air','rail','road')),
  usd_per_km numeric not null,
  km_per_day numeric not null,
  fixed_days numeric not null default 0,
  min_usd numeric not null default 0,
  co2_g_per_tkm numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (org_id, mode)
);
alter table public.rate_cards enable row level security;
drop policy if exists rate_cards_member on public.rate_cards;
create policy rate_cards_member on public.rate_cards for select using (public.is_org_member(org_id));
drop policy if exists rate_cards_owner on public.rate_cards;
create policy rate_cards_owner on public.rate_cards for all using (public.is_org_member(org_id, array['owner','approver'])) with check (public.is_org_member(org_id, array['owner','approver']));

create table if not exists public.carrier_quotes (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id text not null,
  user_id uuid,
  origin_node_id text not null,
  destination_node_id text not null,
  mode text not null,
  carrier text,
  cost numeric not null,
  transit_days numeric not null,
  valid_until date,
  created_at timestamptz not null default now()
);
create index if not exists carrier_quotes_chain_idx on public.carrier_quotes (supply_chain_id, origin_node_id, destination_node_id);
alter table public.carrier_quotes enable row level security;
drop policy if exists carrier_quotes_owner on public.carrier_quotes;
create policy carrier_quotes_owner on public.carrier_quotes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists carrier_quotes_org_read on public.carrier_quotes;
create policy carrier_quotes_org_read on public.carrier_quotes for select using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id)));
