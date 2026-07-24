-- Tensorcraft: opt-in enrollment for the canonical cross-theme journey.
--
-- The cross-theme journey (docs/audits/scalability-architecture-2026-07-21.md
-- F2) runs in two modes. Free play needs no table — any theme is
-- purchasable/playable and the journey only powers soft recommendations,
-- resolved in code from the journey ring. This table backs the other mode: an
-- opt-in CANONICAL TRACK where a learner commits to running the five themes as
-- one sequenced storyline with its own acknowledgement.
--
-- Deliberately minimal: enrollment is just "this user opted into the canonical
-- track, when". Position is NOT stored here — it is derived from per-theme
-- completion (theme_progress) at read time, so there is no denormalized
-- pointer that can drift (matches the no-denormalization guidance in the
-- multi-tenancy audit). Additive and per-user: standard auth.uid() = user_id
-- RLS, so it extends cleanly if org-level journey reporting is wanted later.
--
-- First feature table authored under packages/supabase/migrations/CONVENTIONS.md.

begin;

create table if not exists public.journey_enrollment (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  -- Nullable: set when the learner completes the whole ring, for the
  -- "canonical journey complete" acknowledgement. Derived-at-read could also
  -- compute this, but recording it once avoids re-deriving on every visit and
  -- gives a durable completion timestamp.
  completed_at timestamptz
);

comment on table public.journey_enrollment is
  'Opt-in enrollment in the canonical cross-theme journey (F2). Free-play mode '
  'needs no row. Position is derived from theme_progress, not stored here.';

alter table public.journey_enrollment enable row level security;

-- Self-access only. A learner may see and manage their own enrollment; nobody
-- else's. Cross-user (e.g. org-level) reads, if ever needed, go through the
-- SECURITY DEFINER pattern in CONVENTIONS.md, never a second broad policy here.
drop policy if exists "Users manage own journey enrollment" on public.journey_enrollment;
create policy "Users manage own journey enrollment"
  on public.journey_enrollment
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.schema_migrations (version, name)
values (44, 'journey_enrollment')
on conflict (version) do nothing;

commit;
