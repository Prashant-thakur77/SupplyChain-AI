-- What actually happened after a decision. Closes the loop: estimates vs reality → calibration + accuracy on Agent Ops.
create table if not exists public.decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null unique references public.decisions(id) on delete cascade,
  supply_chain_id text not null,
  recorded_by uuid,
  option_id text,
  estimated_added_cost numeric,
  estimated_added_days numeric,
  actual_added_cost numeric,
  actual_added_days numeric,
  outcome text not null default 'resolved' check (outcome in ('resolved','partially_resolved','failed','not_needed')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists decision_outcomes_chain_idx on public.decision_outcomes (supply_chain_id, created_at desc);
alter table public.decision_outcomes enable row level security;
drop policy if exists decision_outcomes_read on public.decision_outcomes;
create policy decision_outcomes_read on public.decision_outcomes for select using (recorded_by = auth.uid() or (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id))));
