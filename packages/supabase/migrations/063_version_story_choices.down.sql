begin;
-- Data-preserving application rollback. Keep the column and version-aware
-- functions: dropping them would erase the only interpretation of new calls.
-- The old read RPC intentionally exposes only version 1. Old clients can read
-- their existing calls and cannot overwrite new calls. Restore the versioned
-- app to display version 2; never relabel rows as version 1 during rollback.
delete from public.schema_migrations where version = 63;
commit;
