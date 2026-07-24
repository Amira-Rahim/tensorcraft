-- Down-migration for 045. Reverses 045_dashboard_hotpath_indexes.sql.
--
-- Pure index drops — safe and idempotent. Reverting only removes the
-- performance indexes; no data is touched.

begin;

drop index if exists public.idx_theme_progress_user_updated;
drop index if exists public.idx_exercise_attempts_user_attempted;
drop index if exists public.idx_purchases_theme_ids;

delete from public.schema_migrations where version = 45;

commit;
