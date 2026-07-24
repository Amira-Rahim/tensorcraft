-- Down-migration for 044. Drops the enrollment table.
--
-- Safe to reverse: the table is additive and nothing else references it. Any
-- enrollment records are lost on rollback (learners simply re-opt-in).

begin;

drop table if exists public.journey_enrollment;

delete from public.schema_migrations where version = 44;

commit;
