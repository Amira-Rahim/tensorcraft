-- Admin Role System
-- Adds a role column to profiles for role-based access control.
-- Sets amera.salah.89@gmail.com as the initial admin account.

-- ============================================================
-- ADD ROLE COLUMN
-- ============================================================
create type public.user_role as enum ('user', 'admin');

alter table public.profiles
  add column role public.user_role not null default 'user';

-- ============================================================
-- SET INITIAL ADMIN
-- ============================================================
update public.profiles
  set role = 'admin'
  where email = 'amera.salah.89@gmail.com';

-- ============================================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================================

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can view all theme_progress
create policy "Admins can view all progress"
  on public.theme_progress for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can view all purchases
create policy "Admins can view all purchases"
  on public.purchases for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can read waitlist
create policy "Admins can view waitlist"
  on public.waitlist for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- HELPER FUNCTION
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;
