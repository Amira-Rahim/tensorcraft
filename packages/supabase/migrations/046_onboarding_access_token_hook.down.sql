-- Down-migration for 046. Reverses 046_onboarding_access_token_hook.sql.
--
-- OPERATOR: disable the Custom Access Token hook in Supabase Auth config BEFORE
-- rolling back, otherwise auth token minting will error on the missing
-- function. Once disabled, the middleware's profiles fallback resumes handling
-- onboarding gating with no code change.

begin;

drop policy if exists "Auth admin reads profiles for token hook" on public.profiles;
revoke select on table public.profiles from supabase_auth_admin;

drop function if exists public.custom_access_token_hook(jsonb);

delete from public.schema_migrations where version = 46;

commit;
