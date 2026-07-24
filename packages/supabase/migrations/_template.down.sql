-- Down-migration for NNN. Reverses NNN_<name>.sql.
--
-- Must be transaction wrapped and idempotent. If the forward migration is
-- genuinely irreversible (drop column, data overwrite), REPLACE the body below
-- with a comment stating precisely why no rollback is possible and what a
-- recovery would require. A missing .down.sql is a landmine; an explicit
-- "cannot roll back, here is why" is a deliverable.

begin;

-- <reverse the forward DDL, e.g. drop table if exists / drop column if exists>

delete from public.schema_migrations where version = NNN;

commit;
