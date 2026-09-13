-- Anonymised resilience snapshots for benchmarking: no names, no coordinates, only shape + score. One row per chain hash (latest wins).
create table if not exists public.resilience_snapshots (
  chain_hash text primary key,           -- sha256(supply_chain_id) — not reversible to a tenant
  size_band text not null,               -- small (<=8 sites) | medium (9-20) | large (21+)
  node_count int not null,
  lane_count int not null,
  score numeric not null,
  spof_count int not null default 0,
  single_source_count int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.resilience_snapshots enable row level security;  -- service role only; nothing readable by users directly
