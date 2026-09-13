-- First-run product tour: set once the user finishes or skips it (replayable from Profile).
alter table public.users add column if not exists tour_completed_at timestamptz;
