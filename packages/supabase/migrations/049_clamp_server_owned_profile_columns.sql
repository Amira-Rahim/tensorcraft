-- Tensorcraft: clamp stripe_customer_id to service-role writes (R3-5).
--
-- Migration 043 added profiles.stripe_customer_id so the Stripe webhook can
-- key subscription/seat billing to a durable Customer. But profiles is
-- client-writable over PostgREST (the settings page writes it with the anon
-- key), and 040's trigger clamps ONLY `role`. Any signed-in user could
-- therefore pre-set their own row to a victim's `cus_...` id:
--
--   supabase.from("profiles")
--     .update({ stripe_customer_id: "cus_VICTIM" }).eq("id", user.id)
--
-- The webhook's capture is guarded by `.is("stripe_customer_id", null)`, so a
-- poisoned value permanently blocks the legitimate write and the poisoned
-- linkage sticks - cross-user billing confusion the moment recurring billing
-- (roadmap H1/H3) trusts the column. Inert in V1 (nothing reads it yet), but
-- the column must be server-owned from day one.
--
-- Same clamp pattern as 040 (revert, don't raise): a BEFORE UPDATE trigger
-- avoids the policy-recursion trap 021 fixed, and a column-privilege revoke
-- would break the legitimate settings-form row writes.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

-- ============================================================
-- Extend the 040 clamp to every server-owned profiles column
-- ============================================================
-- `role` (040) and `stripe_customer_id` (this migration) may only be changed
-- by the service role. Client-initiated updates keep the old value silently,
-- matching 040's revert-not-raise semantics so settings-form writes that
-- innocently echo the whole row back never start failing.

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      new.stripe_customer_id := old.stripe_customer_id;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_profile_role_escalation()
  from public, anon, authenticated;

-- Trigger from 040 already binds this function to profiles BEFORE UPDATE;
-- recreate defensively in case 049 is ever applied to a database where 040's
-- trigger was dropped out-of-band.
drop trigger if exists trg_prevent_profile_role_escalation on public.profiles;

create trigger trg_prevent_profile_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_escalation();

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (49, 'clamp_server_owned_profile_columns')
on conflict (version) do nothing;

commit;
