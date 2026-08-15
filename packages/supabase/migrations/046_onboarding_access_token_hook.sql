-- Tensorcraft: surface profiles.onboarding_completed as a JWT claim via a
-- Custom Access Token Hook, so the auth middleware stops reading `profiles` on
-- every protected-route request.
--
-- Scalability re-audit 2026-07-24 (§RE-AUDIT / N3). middleware.ts ran a
-- profiles SELECT on every /dashboard, /settings, /onboarding navigation, on
-- top of the mandatory getUser() GoTrue call - a DB round-trip in the hottest
-- authed path. This hook injects `onboarding_completed` into the access token
-- at mint time, reading profiles ONCE per token (not per request); the
-- middleware then reads the claim from the already-validated JWT.
--
-- profiles stays the single source of truth: the browser still writes
-- onboarding_completed, and the hook derives the claim from it. Existing users
-- and pre-refresh tokens simply lack the claim; the middleware FALLS BACK to
-- the profiles read for those, so this migration is correct whether or not the
-- hook is enabled in Supabase Auth config (see OPERATOR note below).
--
-- OPERATOR STEP (not doable in SQL): enable the hook in the Supabase dashboard
--   Authentication → Hooks → "Custom Access Token" → public.custom_access_token_hook
-- (or set auth.hook.custom_access_token.uri in config.toml for local). Until
-- enabled, the claim is absent and the middleware fallback keeps behaviour
-- identical to today. Nothing breaks by applying this migration early.
--
-- Pattern follows the official Supabase custom-access-token-hook docs: the hook
-- runs as role `supabase_auth_admin`, which is granted the minimum needed to
-- read the flag (and ONLY that flag's table), via a scoped RLS policy - never
-- a broad grant. Aligns with CONVENTIONS.md's "least privilege, scoped policy"
-- rule.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

-- ============================================================
-- The hook. STABLE + reads a single indexed row (profiles PK). Defaults the
-- claim to false when no profile row exists yet, so the token always carries a
-- boolean and the middleware never has to distinguish "absent" from "false"
-- once the hook is live.
-- ============================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims    jsonb;
  completed boolean;
begin
  select p.onboarding_completed
    into completed
    from public.profiles p
   where p.id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{onboarding_completed}',
    to_jsonb(coalesce(completed, false))
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

comment on function public.custom_access_token_hook(jsonb) is
  'Supabase Custom Access Token Hook: injects onboarding_completed into the JWT '
  'so middleware need not read profiles per request (re-audit N3). Enable in '
  'Auth → Hooks. profiles remains the source of truth.';

-- ============================================================
-- Least-privilege grants for the auth admin role that executes the hook.
-- Execute is granted ONLY to supabase_auth_admin and revoked from app roles;
-- the hook must not be callable by authenticated/anon clients.
-- ============================================================
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- The hook runs as supabase_auth_admin, which is subject to RLS on profiles.
-- Grant it SELECT and a narrow policy so it can read the flag - and only via
-- this path. No other columns are needed by the hook, but column-scoping a
-- SELECT policy is not possible, so the policy is table-scoped to the auth
-- admin role only (never to app users).
grant select on table public.profiles to supabase_auth_admin;

drop policy if exists "Auth admin reads profiles for token hook" on public.profiles;
create policy "Auth admin reads profiles for token hook"
  on public.profiles
  as permissive
  for select
  to supabase_auth_admin
  using (true);

insert into public.schema_migrations (version, name)
values (46, 'onboarding_access_token_hook')
on conflict (version) do nothing;

commit;
