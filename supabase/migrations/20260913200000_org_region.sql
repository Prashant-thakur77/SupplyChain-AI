-- Data residency: which regional agent-service handles this org's twins (global | eu | us | apac …).
alter table public.orgs add column if not exists region text not null default 'global';
