-- Tensorcraft: close a privilege-escalation hole and two cross-user view leaks.
--
-- ============================================================
-- 1. CRITICAL - self-promotion to admin via profiles UPDATE
-- ============================================================
-- 001_initial_schema.sql:30-32 declares:
--
--   create policy "Users can update own profile"
--     on public.profiles for update
--     using (auth.uid() = id);
--
-- with NO `with check`. Postgres then reuses the `using` expression as the
-- check, so the post-update row only has to still satisfy `auth.uid() = id`.
-- 006_admin_roles.sql:11 later added `role user_role not null default 'user'`
-- to that same table, and nothing was ever added to guard it.
--
-- The write channel is live: apps/web/app/settings/settings-form.tsx writes
-- to profiles directly over PostgREST with the anon key. So any registered
-- user could run ONE line in their browser console:
--
--   supabase.from("profiles").update({ role: "admin" }).eq("id", user.id)
--
-- and 021_fix_admin_policy_recursion.sql then grants them SELECT on every
-- user's profile (including the plaintext github_token), every purchase,
-- every progress row, and the entire waitlist. A full customer-data breach
-- reachable by anyone who signs up.
--
-- Fix: a BEFORE UPDATE trigger rather than a `with check` subquery. A policy
-- that re-queries profiles risks exactly the recursion that migration 021
-- existed to fix, and a column-privilege revoke would silently break the
-- legitimate display_name / avatar_url / onboarding_completed writes.
-- The trigger reverts the change instead of raising, matching the clamping
-- pattern established by 038_prevent_status_regression.sql.

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- Only the service role may change a role. auth.role() reads the role
    -- claim from the request JWT; a service-role key presents 'service_role',
    -- an ordinary signed-in user presents 'authenticated'.
    if coalesce(auth.role(), '') <> 'service_role' then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_profile_role_escalation()
  from public, anon, authenticated;

drop trigger if exists trg_prevent_profile_role_escalation on public.profiles;

create trigger trg_prevent_profile_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_escalation();

-- Belt and braces: make the policy's intent explicit so a future reader does
-- not have to know the implicit-check rule. This constrains identity only;
-- the role guard is the trigger above.
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 2. HIGH - dashboard_stats materialized view leaks all users
-- ============================================================
-- 012_scalability_indexes.sql:25 creates public.dashboard_stats aggregating
-- user_id + progress across the WHOLE theme_progress table. Materialized
-- views cannot carry RLS policies in PostgreSQL, and it lives in `public`,
-- so PostgREST serves it at /rest/v1/dashboard_stats to anon and
-- authenticated alike: cross-user progress plus a user-id enumeration
-- oracle. Migration 039 locked the refresh function but left the view itself
-- readable.
--
-- No application code queries it (the dashboard runs direct queries), so
-- revoking is non-breaking.

revoke all on public.dashboard_stats from public, anon, authenticated;
grant select on public.dashboard_stats to service_role;

-- ============================================================
-- 3. HIGH - theme_progress_summary view bypasses RLS
-- ============================================================
-- 005_progress_summary_view.sql:26 asserts "view inherits RLS from
-- underlying table." That is false as written: Postgres views default to
-- security_invoker = false, so the underlying theme_progress policies are
-- evaluated as the view's OWNER (the migration role, which owns the table
-- and is not subject to its RLS). Every user's progress is therefore
-- readable through the view over PostgREST.
--
-- security_invoker = true evaluates the underlying policies as the CALLER,
-- which is what the original comment claimed was already happening.
-- Requires PostgreSQL 15+ (Supabase is 15+).

alter view public.theme_progress_summary set (security_invoker = true);
