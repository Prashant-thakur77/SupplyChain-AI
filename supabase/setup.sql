-- SupplyChain AI — complete database setup (idempotent). Run once in the Supabase SQL editor
-- (Dashboard → SQL → New query → paste → Run), or `supabase db reset` locally with this as a migration.
-- Order: extensions → core → agent → decisions → RLS → auth trigger.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ── Core ──────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  organisation_name text, industry text, sub_industry text, location text, description text, employee_count int,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.supply_chains (
  supply_chain_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null, description text, form_data jsonb, organisation jsonb,
  timestamp timestamptz default now()
);

create table if not exists public.nodes (
  node_id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid references public.supply_chains(supply_chain_id) on delete cascade,
  type text, name text, description text not null default '', address text,
  location_lat double precision, location_lng double precision,
  capacity numeric not null default 0, risk_level numeric not null default 0,
  data jsonb, width numeric, height numeric, selected boolean, dragging boolean
);
create index if not exists nodes_chain_idx on public.nodes(supply_chain_id);

create table if not exists public.edges (
  edge_id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid references public.supply_chains(supply_chain_id) on delete cascade,
  from_node_id uuid references public.nodes(node_id) on delete cascade,
  to_node_id uuid references public.nodes(node_id) on delete cascade,
  type text, data jsonb, selected boolean
);
create index if not exists edges_chain_idx on public.edges(supply_chain_id);

create table if not exists public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text, message text, notification_type text, severity text,
  read_status boolean default false, citations jsonb,
  created_at timestamptz default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

create table if not exists public.simulations (
  simulation_id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid references public.supply_chains(supply_chain_id) on delete cascade,
  name text, scenario_type text, parameters jsonb, result_summary jsonb, status text,
  simulated_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.impact_results (
  impact_id uuid primary key default gen_random_uuid(),
  simulation_id uuid references public.simulations(simulation_id) on delete cascade,
  metric_name text, metric_value numeric, measurement_unit text, recorded_at timestamptz default now()
);

create table if not exists public.strategies (
  strategy_id uuid primary key default gen_random_uuid(),
  simulation_id uuid references public.simulations(simulation_id) on delete cascade,
  strategy_title text, description text, details jsonb, complexity text, cost_estimate numeric,
  estimated_roi numeric, implementation_time text, risk_reduction numeric, status text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.finalized_strategies (
  id uuid primary key default gen_random_uuid(),
  strategy_id text, name text, type text, status text, priority text, progress numeric,
  estimated_completion text, cost text, roi text, confidence numeric, risk_reduction text,
  affected_nodes numeric, total_tasks numeric, completed_tasks numeric, description text,
  assigned_team text, team_lead text, risk_level text, scenario_source text, date_finalized date,
  created_at timestamptz default now()
);
create table if not exists public.strategy_nodes (
  id uuid primary key default gen_random_uuid(),
  finalized_strategy_id uuid references public.finalized_strategies(id) on delete cascade,
  node_id uuid, name text, risk_level text, confidence numeric, status text, assigned_team text
);
create table if not exists public.strategy_tasks (
  id uuid primary key default gen_random_uuid(),
  strategy_node_id uuid references public.strategy_nodes(id) on delete cascade,
  finalized_strategy_id uuid references public.finalized_strategies(id) on delete cascade,
  title text, status text, deadline text, priority text, assignee text, blocker text, start_date text, duration text, node_name text
);

create table if not exists public.forecasts (
  forecast_id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid references public.supply_chains(supply_chain_id) on delete cascade,
  node_id uuid, user_id uuid,
  forecast_data jsonb not null default '{}'::jsonb, scenario_json jsonb, market_data jsonb, news_data jsonb, weather_data jsonb,
  confidence_score numeric, risk_score numeric, forecast_period int,
  forecast_start_date timestamptz, forecast_end_date timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.supply_chain_intel (
  intel_id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid references public.supply_chains(supply_chain_id) on delete cascade,
  node_id uuid not null, user_id uuid, intelligence_data jsonb, news jsonb, weather jsonb,
  quality_score numeric, risk_score numeric, created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.weather_intelligence (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid references public.supply_chains(supply_chain_id) on delete cascade,
  node_id uuid, node_name text, user_id uuid, condition text, description text,
  temperature numeric, wind_speed numeric, visibility numeric, is_adverse boolean default false, severity text,
  checked_at timestamptz default now(),
  unique (supply_chain_id, node_id)
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  supply_chain_id uuid, user_id uuid, suggestions jsonb, event text, filter text, schema text,
  expires_at timestamptz, created_at timestamptz default now(),
  unique (supply_chain_id, user_id)
);

create table if not exists public.audit_logs (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid, actor text, action text, details jsonb, status text,
  timestamp timestamptz default now()
);
create index if not exists audit_logs_user_idx on public.audit_logs(user_id, timestamp desc);

create table if not exists public.user_settings (
  setting_id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  theme text, dashboard_layout jsonb, notification_preferences jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ── Agent tables ───────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  session_id text primary key, state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.agent_traces (
  id uuid primary key default gen_random_uuid(),
  session_id text not null, agent_name text not null,
  started_at timestamptz not null default now(), ended_at timestamptz, duration_ms int,
  input_tokens int, output_tokens int, success boolean, error text, workflow_stage text,
  user_id text, supply_chain_id text
);
create index if not exists agent_traces_chain_stage_idx on public.agent_traces (supply_chain_id, workflow_stage, started_at desc);
create index if not exists agent_traces_session_idx on public.agent_traces (session_id);
create table if not exists public.pending_approvals (
  id uuid primary key default gen_random_uuid(), session_id text not null, strategy_data jsonb not null,
  status text not null default 'pending', created_at timestamptz not null default now(), expires_at timestamptz not null, escalated boolean not null default false
);

-- ── Decisions (round 1) ────────────────────────────────────────────────────────────────────────────────
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, supply_chain_id text not null, event_id text,
  title text not null, summary text, options jsonb not null default '[]'::jsonb,
  recommended_option_id text, chosen_option_id text, rationale text, confidence numeric,
  sources jsonb default '[]'::jsonb, trace_id text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','snoozed','expired')),
  created_at timestamptz not null default now(), decided_at timestamptz, snoozed_until timestamptz
);
create index if not exists decisions_user_status_idx on public.decisions (user_id, status, created_at desc);
create table if not exists public.route_plans (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references public.decisions(id) on delete cascade,
  candidate_id text not null, path jsonb, labels jsonb, modes jsonb, cost numeric, transit_days numeric,
  added_cost numeric, added_days numeric, max_risk numeric, feasible boolean default true
);
create index if not exists route_plans_decision_idx on public.route_plans (decision_id);
create table if not exists public.alert_actions (
  id uuid primary key default gen_random_uuid(), notification_id uuid not null, user_id uuid,
  status text not null check (status in ('acknowledged','in_progress','resolved','reopened')),
  assignee text, note text, created_at timestamptz not null default now()
);
create index if not exists alert_actions_notification_idx on public.alert_actions (notification_id, created_at desc);

-- ── Row Level Security ─────────────────────────────────────────────────────────────────────────────────
-- The browser uses the anon key under these policies; the agent-service uses the service role (bypasses RLS).
do $$
declare t text;
begin
  foreach t in array array['users','supply_chains','nodes','edges','notifications','simulations','impact_results','strategies',
    'finalized_strategies','strategy_nodes','strategy_tasks','forecasts','supply_chain_intel','weather_intelligence','ai_suggestions',
    'audit_logs','user_settings','sessions','agent_traces','pending_approvals','decisions','route_plans','alert_actions'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Owner policies (user_id = auth.uid())
drop policy if exists users_self on public.users;
create policy users_self on public.users for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['supply_chains','notifications','forecasts','supply_chain_intel','weather_intelligence','ai_suggestions','audit_logs','user_settings','decisions','alert_actions'] loop
    execute format('drop policy if exists %I_owner on public.%I', t, t);
    execute format('create policy %I_owner on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- Child tables scoped through their parent supply chain
drop policy if exists nodes_owner on public.nodes;
create policy nodes_owner on public.nodes for all
  using (exists (select 1 from public.supply_chains s where s.supply_chain_id = nodes.supply_chain_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.supply_chains s where s.supply_chain_id = nodes.supply_chain_id and s.user_id = auth.uid()));
drop policy if exists edges_owner on public.edges;
create policy edges_owner on public.edges for all
  using (exists (select 1 from public.supply_chains s where s.supply_chain_id = edges.supply_chain_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.supply_chains s where s.supply_chain_id = edges.supply_chain_id and s.user_id = auth.uid()));
drop policy if exists simulations_owner on public.simulations;
create policy simulations_owner on public.simulations for all
  using (exists (select 1 from public.supply_chains s where s.supply_chain_id = simulations.supply_chain_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.supply_chains s where s.supply_chain_id = simulations.supply_chain_id and s.user_id = auth.uid()));
drop policy if exists strategies_owner on public.strategies;
create policy strategies_owner on public.strategies for all
  using (exists (select 1 from public.simulations si join public.supply_chains s on s.supply_chain_id = si.supply_chain_id where si.simulation_id = strategies.simulation_id and s.user_id = auth.uid()));
drop policy if exists impact_results_owner on public.impact_results;
create policy impact_results_owner on public.impact_results for all
  using (exists (select 1 from public.simulations si join public.supply_chains s on s.supply_chain_id = si.supply_chain_id where si.simulation_id = impact_results.simulation_id and s.user_id = auth.uid()));
drop policy if exists route_plans_owner on public.route_plans;
create policy route_plans_owner on public.route_plans for all
  using (exists (select 1 from public.decisions d where d.id = route_plans.decision_id and d.user_id = auth.uid()));
-- agent_traces.user_id is text (written by the service); readable by the owner for the trace drawer
drop policy if exists agent_traces_owner on public.agent_traces;
create policy agent_traces_owner on public.agent_traces for select using (user_id = auth.uid()::text);
-- finalized strategies are app-scoped (no user column); allow authenticated users
do $$
declare t text;
begin
  foreach t in array array['finalized_strategies','strategy_nodes','strategy_tasks','sessions','pending_approvals'] loop
    execute format('drop policy if exists %I_auth on public.%I', t, t);
    execute format('create policy %I_auth on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', t, t);
  end loop;
end $$;

-- ── Auth → users row ───────────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, coalesce(new.email, 'unknown@example.com'))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
