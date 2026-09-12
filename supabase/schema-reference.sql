create table public.nodes (
  node_id uuid not null default extensions.uuid_generate_v4 (),
  type text null,
  name text null,
  description text not null,
  location_lat numeric null,
  location_lng numeric null,
  address text null,
  data jsonb null,
  width bigint null,
  height bigint null,
  selected boolean null default false,
  dragging boolean null default false,
  supply_chain_id uuid null,
  constraint nodes_pkey primary key (node_id),
  constraint nodes_supply_chain_id_fkey foreign KEY (supply_chain_id) references supply_chains (supply_chain_id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_nodes_data_gin on public.nodes using gin (data) TABLESPACE pg_default;

create index IF not exists idx_nodes_type on public.nodes using btree (type) TABLESPACE pg_default;

create index IF not exists idx_nodes_supply_chain on public.nodes using btree (supply_chain_id) TABLESPACE pg_default;

create table public.edges (
  edge_id uuid not null default extensions.uuid_generate_v4 (),
  supply_chain_id uuid null,
  from_node_id uuid null,
  to_node_id uuid null,
  type text null,
  data jsonb null,
  selected boolean null,
  constraint edges_pkey primary key (edge_id),
  constraint edges_from_node_id_fkey foreign KEY (from_node_id) references nodes (node_id) on delete CASCADE,
  constraint edges_supply_chain_id_fkey foreign KEY (supply_chain_id) references supply_chains (supply_chain_id) on delete CASCADE,
  constraint edges_to_node_id_fkey foreign KEY (to_node_id) references nodes (node_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_edges_data_gin on public.edges using gin (data) TABLESPACE pg_default;

create index IF not exists idx_edges_supply_chain on public.edges using btree (supply_chain_id) TABLESPACE pg_default;

create table public.supply_chains (
  supply_chain_id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  name text not null,
  description text null,
  organisation jsonb null,
  form_data jsonb null default '{}'::jsonb,
  constraint supply_chains_pkey primary key (supply_chain_id),
  constraint supply_chains_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

