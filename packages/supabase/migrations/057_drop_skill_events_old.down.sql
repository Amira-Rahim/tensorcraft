-- Down-migration for 057. The dropped table held ZERO rows (verified
-- 2026-07-25 before the drop), so recreating an empty shell restores the
-- pre-057 state exactly. Mirrors the pre-013 skill_events shape.

begin;

create table if not exists public.skill_events_old (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  event_type text not null,
  skill_axis text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.skill_events_old enable row level security;

delete from public.schema_migrations where version = 57;

commit;
