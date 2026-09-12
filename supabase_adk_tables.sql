-- Sessions table for ADK state persistence
create table if not exists sessions (
  session_id text primary key,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agent traces for observability
create table if not exists agent_traces (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  agent_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms int,
  input_tokens int,
  output_tokens int,
  success boolean,
  error text,
  workflow_stage text,
  user_id text,
  supply_chain_id text
);

-- Agent queue for A2A communication
create table if not exists agent_queue (
  id uuid primary key default gen_random_uuid(),
  target_agent text not null,
  payload jsonb not null,
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retry_count int not null default 0,
  error_log text
);

-- Pending approvals for Human-in-the-Loop
create table if not exists pending_approvals (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  strategy_data jsonb not null,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected', 'timeout'
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  escalated boolean not null default false
);
