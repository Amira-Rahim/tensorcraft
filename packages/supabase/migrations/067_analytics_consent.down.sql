begin;

-- Removing the store removes every saved choice. Server capture must remain
-- disabled when its consent lookup fails. Reapplying requires fresh choices.
drop function if exists public.set_analytics_consent(boolean, integer);
drop table if exists public.analytics_consents;
delete from public.schema_migrations where version = 67;
commit;
