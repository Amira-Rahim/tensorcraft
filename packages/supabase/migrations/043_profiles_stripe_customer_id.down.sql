-- Down-migration for 043. Removes the Stripe customer column and its index.
--
-- Safe to reverse: the column is nullable and nothing depended on it at the
-- time of writing. Any customer ids captured while it was live are lost on
-- rollback but are recoverable from Stripe.

begin;

drop index if exists public.idx_profiles_stripe_customer_id;

alter table public.profiles
  drop column if exists stripe_customer_id;

delete from public.schema_migrations where version = 43;

commit;
