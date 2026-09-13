-- Flows: what actually moves on the network. Impact becomes value-weighted instead of capacity-weighted.
create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id text not null,
  user_id uuid,
  origin_node_id text not null,
  destination_node_id text not null,
  product text,
  units_per_week numeric not null default 0,
  value_per_unit numeric not null default 0,   -- USD
  lead_time_days numeric,                      -- committed delivery lead time
  penalty_per_day numeric default 0,           -- contractual late penalty per day
  inventory_days numeric default 0,            -- days of cover at destination
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists flows_chain_idx on public.flows (supply_chain_id);
alter table public.flows enable row level security;
drop policy if exists flows_owner on public.flows;
create policy flows_owner on public.flows for all using (user_id = auth.uid()) with check (user_id = auth.uid());
