begin;
-- Data-preserving rollback: old app versions ignore this nullable preference.
-- Retain values so re-enabling the feature does not erase learner choices.
delete from public.schema_migrations where version = 62;
commit;
