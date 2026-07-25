-- Down-migration for 049: restore the 040 version of the clamp function,
-- which guards `role` only. The trigger binding is unchanged (both versions
-- attach the same function to the same BEFORE UPDATE trigger).
--
-- NOTE: rolling back re-opens R3-5 — stripe_customer_id becomes client-
-- writable again. Only do this if 049 itself breaks profile updates.

begin;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
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

delete from public.schema_migrations where version = 49;

commit;
