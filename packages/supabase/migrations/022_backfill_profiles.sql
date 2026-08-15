-- Backfill missing profile rows + harden the auth-signup trigger.
--
-- Background:
--   `handle_new_user` (defined in migration 001) is fired by an AFTER INSERT
--   trigger on `auth.users`. It bare-INSERTs into `public.profiles`. Any
--   failure (e.g. transient or pre-existing row) bubbles up and aborts the
--   auth signup. Worse, users who existed before migration 001 was applied
--   never get a profile at all - the trigger only fires on new auth rows.
--
-- Fix:
--   1. Backfill profile rows for every `auth.users` entry that has none.
--   2. Make `handle_new_user` idempotent via `ON CONFLICT (id) DO NOTHING`.

-- ============================================================
-- 1. Backfill
-- ============================================================
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.email is not null;

-- ============================================================
-- 2. Idempotent trigger function
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
