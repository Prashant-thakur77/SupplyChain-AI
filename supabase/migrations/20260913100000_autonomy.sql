-- Autonomy policy per supply chain: when the agent may act on its own, and where to notify.
create table if not exists public.autonomy_policies (
  supply_chain_id text primary key,
  user_id uuid,
  auto_approve boolean not null default false,
  max_added_cost numeric not null default 2000,
  max_added_days numeric not null default 5,
  min_confidence numeric not null default 0.8,
  expire_hours int not null default 48,
  webhook_url text,
  updated_at timestamptz not null default now()
);
alter table public.autonomy_policies enable row level security;
drop policy if exists autonomy_policies_owner on public.autonomy_policies;
create policy autonomy_policies_owner on public.autonomy_policies for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.decisions add column if not exists auto_approved boolean not null default false;
alter table public.decisions add column if not exists policy_reason text;
