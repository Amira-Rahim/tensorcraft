-- Down-migration for 054: removes the size bound. exercise_attempts
-- becomes an unbounded storage vector again.

begin;

alter table public.exercise_attempts
  drop constraint if exists chk_submitted_code_bounded;

delete from public.schema_migrations where version = 54;

commit;
