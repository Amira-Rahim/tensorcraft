-- Tensorcraft: lock down dispatch_milestone (stored-phishing hole).
--
-- Migration 029 created dispatch_milestone(p_user_id, ...) as SECURITY
-- DEFINER with NO auth.uid() guard, on the assumption it is "not exposed to
-- clients." But no REVOKE was ever issued, and Postgres grants EXECUTE on
-- functions to PUBLIC by default — PostgREST therefore exposes it at
-- /rest/v1/rpc/dispatch_milestone to anon and authenticated alike. Any
-- client could insert arbitrary "operator messages" (including an
-- attacker-controlled cta_href link) into ANY user's DISPATCH inbox.
--
-- The function has no legitimate client caller (repo-wide grep: zero
-- invocations); it exists for future server-side triggers/jobs. Keep it,
-- but restrict execution to service_role only.

revoke execute on function public.dispatch_milestone(uuid, text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.dispatch_milestone(uuid, text, text, text, text)
  to service_role;
