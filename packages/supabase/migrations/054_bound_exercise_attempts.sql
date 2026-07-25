-- Tensorcraft: bound exercise_attempts.submitted_code (fresh-eyes rerun §7;
-- register §3 P2 "~6MB/min achievable per user").
--
-- The column had no length limit and the table no retention, making it an
-- unbounded storage vector for any authenticated user. 50,000 chars is ~25×
-- the longest legitimate solution in the corpus — generous for real code,
-- useless for abuse. NOT VALID so the constraint applies to new rows without
-- scanning/failing on any existing oversized row; run
--   alter table public.exercise_attempts validate constraint chk_submitted_code_bounded;
-- during a quiet window to backfill validation (operator note).
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

alter table public.exercise_attempts
  drop constraint if exists chk_submitted_code_bounded;

alter table public.exercise_attempts
  add constraint chk_submitted_code_bounded
  check (submitted_code is null or length(submitted_code) <= 50000)
  not valid;

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (54, 'bound_exercise_attempts')
on conflict (version) do nothing;

commit;
