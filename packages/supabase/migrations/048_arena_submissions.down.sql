-- Down-migration for 048. Reverses 048_arena_submissions.sql.
--
-- Drops the arena submission table and its policy/indexes. Safe while arena is
-- unbuilt; once real scores exist, rolling back destroys them.

begin;

drop policy if exists "Users read own arena submissions" on public.arena_submissions;
drop table if exists public.arena_submissions;

delete from public.schema_migrations where version = 48;

commit;
