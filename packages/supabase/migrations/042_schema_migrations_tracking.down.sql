-- Down-migration for 042. Drops the ledger entirely.
--
-- Note this is self-consistent: dropping the table also removes the row that
-- recorded 042, so there is no separate delete-from-ledger step.

begin;

drop table if exists public.schema_migrations;

commit;
