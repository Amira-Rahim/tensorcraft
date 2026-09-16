-- Tensorcraft: Review queue for spaced recall (restores 027 in changed form).
--
-- Migration 033 dropped the original review_queue, its SM-2-lite RPCs, and
-- the epsilon-greedy selector on 2026-06-01. This restores the table only.
-- The scheduling math now lives in packages/shared/src/review-schedule.ts so
-- that guests (localStorage) and signed-in learners (Postgres) run one
-- implementation. See docs/superpowers/specs/2026-09-15-spaced-review-design.md.
--
-- Differences from 027, all deliberate:
--   theme_id -> world_id (migration 058), and prompt_index joins the key so
--   each recall prompt schedules independently: 20 deep-orbit lessons carry
--   two prompts and two carry three.
--   No bandit: review_queue_epsilon(), the selector, and was_explored stay
--   deleted until Terra Grid (world 4) launches and the algorithm is teachable.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped, idempotent, records its version, paired .down.sql.

begin;

create table if not exists public.review_queue (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  world_id         text not null,
  module_id        text not null,
  lesson_id        text not null,
  prompt_index     integer not null default 0 check (prompt_index >= 0),
  pulls            integer not null default 0 check (pulls >= 0),
  successes        integer not null default 0 check (successes >= 0 and successes <= pulls),
  last_reviewed_at timestamptz,
  next_review_at   timestamptz not null,
  created_at       timestamptz not null default now(),

  primary key (user_id, world_id, lesson_id, prompt_index)
);

-- getDue is the only hot read. NOT partial on `next_review_at <= now()` as
-- 027 was: now() is not immutable, so Postgres rejects it in an index predicate.
create index if not exists idx_review_queue_due
  on public.review_queue (user_id, world_id, next_review_at);

alter table public.review_queue enable row level security;

-- SELECT for the server component's read.
drop policy if exists "Users can view own review queue" on public.review_queue;
create policy "Users can view own review queue"
  on public.review_queue for select
  using (auth.uid() = user_id);

-- INSERT and UPDATE are REQUIRED, not optional. apps/api writes via
-- getSupabaseServerClient(token), which is built on the service-role key but
-- spreads the caller's JWT as an Authorization header, so PostgREST resolves
-- the role from that JWT and RLS is enforced. With no write policy every
-- write is silently denied.
--
-- This exact mistake has already shipped here once: migration 013 recreated
-- skill_events carrying only its SELECT policy, and migration 041 exists to
-- repair it. Its comment: "With no INSERT policy, every write is denied ...
-- Nothing surfaced this because emitSkillEvent had zero call sites."
-- Compare exercise_attempts, which carries this policy at 004:25 for the
-- identical client factory and works.
drop policy if exists "Users can insert own review queue" on public.review_queue;
create policy "Users can insert own review queue"
  on public.review_queue for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own review queue" on public.review_queue;
create policy "Users can update own review queue"
  on public.review_queue for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (61, 'review_queue')
on conflict (version) do nothing;

commit;
