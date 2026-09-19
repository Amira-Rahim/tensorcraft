begin;
-- The column predates this release in production. Preserve it and all reports.
-- Application rollback requires no schema removal. Only unrecord this repair.
delete from public.schema_migrations where version = 65;
commit;
