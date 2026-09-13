-- New twins inherit the creator's org automatically.
create or replace function public.set_chain_org() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null and new.user_id is not null then
    select org_id into new.org_id from public.org_members where user_id = new.user_id order by (role = 'owner') desc, created_at limit 1;
  end if;
  return new;
end $$;
drop trigger if exists supply_chains_set_org on public.supply_chains;
create trigger supply_chains_set_org before insert on public.supply_chains for each row execute procedure public.set_chain_org();
