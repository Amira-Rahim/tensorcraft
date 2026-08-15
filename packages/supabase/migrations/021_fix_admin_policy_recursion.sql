-- Fix infinite recursion in admin RLS policies.
--
-- Migration 006 created admin SELECT policies that subquery the same table
-- they are attached to (or, transitively, the profiles table). PostgreSQL
-- re-applies SELECT policies inside those subqueries, triggering infinite
-- recursion (SQLSTATE 42P17). The error surfaces on UPDATE statements that
-- return the updated row (PostgREST default), which evaluates SELECT policies.
--
-- Fix: replace the inline `exists (select 1 from public.profiles ...)`
-- subqueries with the `public.is_admin()` helper. That function is declared
-- SECURITY DEFINER, so it runs as the table owner and bypasses RLS - no
-- recursion.

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can view all progress" on public.theme_progress;
drop policy if exists "Admins can view all purchases" on public.purchases;
drop policy if exists "Admins can view waitlist" on public.waitlist;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can view all progress"
  on public.theme_progress for select
  using (public.is_admin());

create policy "Admins can view all purchases"
  on public.purchases for select
  using (public.is_admin());

create policy "Admins can view waitlist"
  on public.waitlist for select
  using (public.is_admin());
