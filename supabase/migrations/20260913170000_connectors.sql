-- ERP / TMS / carrier connectors: pull flows and shipments from the system of record on a schedule.
create table if not exists public.connectors (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id text not null,
  user_id uuid,
  name text not null,
  kind text not null check (kind in ('rest','csv_url','sap','netsuite','odoo')),
  entity text not null default 'shipments' check (entity in ('flows','shipments')),
  config jsonb not null default '{}'::jsonb,   -- { url, headers, records_path, fields:{...}, auth:{...} }
  schedule_minutes int not null default 60,
  enabled boolean not null default true,
  last_sync_at timestamptz,
  last_status text,
  last_error text,
  last_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists connectors_chain_idx on public.connectors (supply_chain_id);
alter table public.connectors enable row level security;
drop policy if exists connectors_owner on public.connectors;
create policy connectors_owner on public.connectors for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists connectors_org_read on public.connectors;
create policy connectors_org_read on public.connectors for select using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id)));
-- Flows become upsertable by lane+product (connector syncs are idempotent).
create unique index if not exists flows_lane_product_idx on public.flows (supply_chain_id, origin_node_id, destination_node_id, product);
