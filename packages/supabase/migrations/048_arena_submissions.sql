-- Tensorcraft: arena submission table — the write-model bone for a competitive
-- leaderboard.
--
-- Scalability re-audit 2026-07-24 (§RE-AUDIT / N1, finding A-F1). Today ALL
-- scoring is client-reported: the browser computes pass/score and POSTs it, and
-- exercise_attempts / theme_progress / skill_events are written under the user's
-- own JWT. A leaderboard built on any of those is trivially forgeable
-- (POST {passed:true, score:100}). The irreversible decision that must be made
-- NOW — before any submission code exists — is the WRITE MODEL: an arena score
-- table must be SERVICE-ROLE-WRITE-ONLY, so the only way a row appears is the
-- API re-scoring a submission server-side. Retrofitting client-writable →
-- authoritative after launch invalidates every score already posted.
--
-- This migration lays that bone and nothing more (the scoring service, the
-- leaderboard read RPC, matchmaking are additive and deferred — see
-- docs/arena-scoring-contract.md). Deliberately NO insert/update/delete policy:
-- clients cannot write here at all. service_role bypasses RLS, so the Hono API
-- (which alone holds the service key) is the only writer. Self-read is allowed
-- so a learner can see their own submissions; the public top-N leaderboard will
-- be a SECURITY DEFINER function (CONVENTIONS.md pattern), never a broad policy.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

create table if not exists public.arena_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  -- Which arena challenge this scores. Free-form slug for now; a challenges
  -- table can be added later and this FK'd to it (additive).
  challenge_id  text not null,
  -- AUTHORITATIVE score: written only by the server after it re-runs the
  -- submission against a hidden hold-out. Never a client-reported number.
  score         numeric not null,
  -- The raw submitted code, retained so a submission can be re-scored / audited
  -- (anti-cheat). Nullable so a future non-code challenge type can omit it.
  submitted_code text,
  -- When the server verified/scored this submission.
  verified_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

comment on table public.arena_submissions is
  'Authoritative arena scores. SERVICE-ROLE-WRITE-ONLY (no client write policy) '
  'so a leaderboard cannot be forged (re-audit N1 / A-F1). Public top-N reads go '
  'through a SECURITY DEFINER RPC, never a broad policy.';

-- Leaderboard ranking probe: best scores per challenge.
create index if not exists idx_arena_submissions_challenge_score
  on public.arena_submissions (challenge_id, score desc);
-- A learner's own history.
create index if not exists idx_arena_submissions_user
  on public.arena_submissions (user_id, challenge_id);

alter table public.arena_submissions enable row level security;

-- Self-read ONLY. No insert/update/delete policy exists, so authenticated
-- clients cannot write scores; the service-role API is the sole writer. This is
-- the whole point — the write model is authoritative by construction.
drop policy if exists "Users read own arena submissions" on public.arena_submissions;
create policy "Users read own arena submissions"
  on public.arena_submissions
  for select
  using (auth.uid() = user_id);

insert into public.schema_migrations (version, name)
values (48, 'arena_submissions')
on conflict (version) do nothing;

commit;
