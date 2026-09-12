-- SupplyChain AI — decisions, route plans, alert actions.
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  supply_chain_id text not null,
  event_id text,
  title text not null,
  summary text,
  options jsonb not null default '[]'::jsonb,
  recommended_option_id text,
  chosen_option_id text,
  rationale text,
  confidence numeric,
  sources jsonb default '[]'::jsonb,
  trace_id text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','snoozed','expired')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  snoozed_until timestamptz
);
create index if not exists decisions_user_status_idx on public.decisions (user_id, status, created_at desc);
create index if not exists decisions_chain_idx on public.decisions (supply_chain_id, created_at desc);

create table if not exists public.route_plans (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references public.decisions(id) on delete cascade,
  candidate_id text not null,
  path jsonb,
  labels jsonb,
  modes jsonb,
  cost numeric,
  transit_days numeric,
  added_cost numeric,
  added_days numeric,
  max_risk numeric,
  feasible boolean default true
);
create index if not exists route_plans_decision_idx on public.route_plans (decision_id);

-- Append-only log of operator actions on an alert; the latest row is the alert's current state.
create table if not exists public.alert_actions (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null,
  user_id uuid,
  status text not null check (status in ('acknowledged','in_progress','resolved','reopened')),
  assignee text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists alert_actions_notification_idx on public.alert_actions (notification_id, created_at desc);

alter table public.decisions enable row level security;
alter table public.route_plans enable row level security;
alter table public.alert_actions enable row level security;

drop policy if exists decisions_owner on public.decisions;
create policy decisions_owner on public.decisions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists route_plans_owner on public.route_plans;
create policy route_plans_owner on public.route_plans for all
  using (exists (select 1 from public.decisions d where d.id = decision_id and d.user_id = auth.uid()));

drop policy if exists alert_actions_owner on public.alert_actions;
create policy alert_actions_owner on public.alert_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- agent_traces gets a stage index for the trace drawer and cooldown lookups.
create index if not exists agent_traces_chain_stage_idx on public.agent_traces (supply_chain_id, workflow_stage, started_at desc);
create index if not exists agent_traces_session_idx on public.agent_traces (session_id);
