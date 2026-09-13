-- Organisations & roles. Every user gets a personal org; twins belong to an org; members see the org's twins.
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.org_members (
  org_id uuid references public.orgs(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null default 'planner' check (role in ('owner','approver','planner','viewer')),
  invited_email text,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists org_members_user_idx on public.org_members (user_id);
alter table public.supply_chains add column if not exists org_id uuid references public.orgs(id) on delete set null;
create index if not exists supply_chains_org_idx on public.supply_chains (org_id);

-- helper: is the current user a member of org (any role) / with one of the roles
create or replace function public.is_org_member(p_org uuid, p_roles text[] default null) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.org_members m where m.org_id = p_org and m.user_id = auth.uid() and (p_roles is null or m.role = any(p_roles)));
$$;
create or replace function public.chain_org(p_chain text) returns uuid language sql stable security definer set search_path = public as $$
  select s.org_id from public.supply_chains s where s.supply_chain_id::text = p_chain;
$$;

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
drop policy if exists orgs_member_read on public.orgs;
create policy orgs_member_read on public.orgs for select using (public.is_org_member(id));
drop policy if exists orgs_owner_write on public.orgs;
create policy orgs_owner_write on public.orgs for update using (public.is_org_member(id, array['owner']));
drop policy if exists org_members_read on public.org_members;
create policy org_members_read on public.org_members for select using (public.is_org_member(org_id));

-- Org-wide visibility on top of the owner policies
drop policy if exists supply_chains_org_read on public.supply_chains;
create policy supply_chains_org_read on public.supply_chains for select using (org_id is not null and public.is_org_member(org_id));
drop policy if exists nodes_org_read on public.nodes;
create policy nodes_org_read on public.nodes for select using (exists (select 1 from public.supply_chains s where s.supply_chain_id = nodes.supply_chain_id and s.org_id is not null and public.is_org_member(s.org_id)));
drop policy if exists edges_org_read on public.edges;
create policy edges_org_read on public.edges for select using (exists (select 1 from public.supply_chains s where s.supply_chain_id = edges.supply_chain_id and s.org_id is not null and public.is_org_member(s.org_id)));
drop policy if exists decisions_org_read on public.decisions;
create policy decisions_org_read on public.decisions for select using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id)));
drop policy if exists decisions_org_approve on public.decisions;
create policy decisions_org_approve on public.decisions for update using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id), array['owner','approver']));
drop policy if exists flows_org_read on public.flows;
create policy flows_org_read on public.flows for select using (public.chain_org(supply_chain_id) is not null and public.is_org_member(public.chain_org(supply_chain_id)));
drop policy if exists route_plans_org_read on public.route_plans;
create policy route_plans_org_read on public.route_plans for select using (exists (select 1 from public.decisions d where d.id = route_plans.decision_id and public.chain_org(d.supply_chain_id) is not null and public.is_org_member(public.chain_org(d.supply_chain_id))));
drop policy if exists decision_tasks_org_read on public.decision_tasks;
create policy decision_tasks_org_read on public.decision_tasks for select using (exists (select 1 from public.decisions d where d.id = decision_tasks.decision_id and public.chain_org(d.supply_chain_id) is not null and public.is_org_member(public.chain_org(d.supply_chain_id))));

-- Personal org on signup + backfill
create or replace function public.ensure_personal_org(p_user uuid, p_email text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.org_members where user_id = p_user and role = 'owner' limit 1;
  if v_org is null then
    insert into public.orgs (name, created_by) values (coalesce(split_part(p_email, '@', 2), 'My organisation'), p_user) returning id into v_org;
    insert into public.org_members (org_id, user_id, role) values (v_org, p_user, 'owner') on conflict do nothing;
  end if;
  update public.supply_chains set org_id = v_org where user_id = p_user and org_id is null;
  return v_org;
end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, coalesce(new.email, 'unknown@example.com')) on conflict (id) do nothing;
  perform public.ensure_personal_org(new.id, coalesce(new.email, ''));
  return new;
end $$;
do $$ declare r record; begin for r in select id, email from public.users loop perform public.ensure_personal_org(r.id, r.email); end loop; end $$;
