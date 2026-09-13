-- Carbon & cost co-optimisation: how much the org weighs CO2e when ranking reroutes, and the price per tonne used.
alter table public.autonomy_policies add column if not exists carbon_weight numeric not null default 0;
alter table public.autonomy_policies add column if not exists carbon_price numeric not null default 100;
