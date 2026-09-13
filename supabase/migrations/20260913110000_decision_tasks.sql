-- Execution checklist: the Strategist's mitigation steps become trackable tasks once a decision exists.
create table if not exists public.decision_tasks (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references public.decisions(id) on delete cascade,
  user_id uuid,
  position int not null default 0,
  title text not null,
  owner text,
  due_in_days int,
  detail text,
  status text not null default 'todo' check (status in ('todo','doing','done','skipped')),
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists decision_tasks_decision_idx on public.decision_tasks (decision_id, position);
alter table public.decision_tasks enable row level security;
drop policy if exists decision_tasks_owner on public.decision_tasks;
create policy decision_tasks_owner on public.decision_tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
