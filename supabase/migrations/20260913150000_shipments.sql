-- Shipments in flight and the milestones carriers push (EDI/webhook/API). Positions are derived from progress along the lane.
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id text not null,
  user_id uuid,
  reference text not null,            -- container / AWB / PO number
  origin_node_id text not null,
  destination_node_id text not null,
  mode text not null default 'sea',
  carrier text,
  etd timestamptz,
  planned_eta timestamptz,
  current_eta timestamptz,
  status text not null default 'planned' check (status in ('planned','in_transit','delayed','arrived','cancelled')),
  progress numeric not null default 0,  -- 0..1 along the lane
  last_event text,
  last_event_at timestamptz,
  value_usd numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipments_chain_idx on public.shipments (supply_chain_id, status);
create unique index if not exists shipments_ref_idx on public.shipments (supply_chain_id, reference);
alter table public.shipments enable row level security;
drop policy if exists shipments_owner on public.shipments;
create policy shipments_owner on public.shipments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists shipments_org_read on public.shipments;
create policy shipments_org_read on public.shipments for select using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id)));

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  at timestamptz not null default now(),
  event text not null,                -- departed | at_port | customs_hold | delayed | arrived | ...
  location text,
  eta timestamptz,
  progress numeric,
  raw jsonb
);
create index if not exists shipment_events_ship_idx on public.shipment_events (shipment_id, at desc);
alter table public.shipment_events enable row level security;
drop policy if exists shipment_events_read on public.shipment_events;
create policy shipment_events_read on public.shipment_events for select using (exists (select 1 from public.shipments s where s.id = shipment_id and (s.user_id = auth.uid() or (public.chain_org(s.supply_chain_id) is not null and public.is_org_member(public.chain_org(s.supply_chain_id))))));
