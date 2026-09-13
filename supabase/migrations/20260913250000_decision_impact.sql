-- Keep the impact estimate with the decision so the card shows revenue at risk, delay and SLA penalties.
alter table public.decisions add column if not exists impact jsonb;
