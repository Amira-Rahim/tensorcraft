begin;
-- Application rollback can stop using these additive tables and RPC. Retain
-- practice history and deduplication streams: dropping them loses learner data
-- and permits a later retry to replace first outcomes. Removal requires an
-- explicit backup/retention decision, not an automatic application rollback.
delete from public.schema_migrations where version=64;
commit;
