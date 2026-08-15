-- Tensorcraft: purchases must SURVIVE account deletion (Tier 1-LEGAL
-- deletion endpoint prerequisite; R3-8 retention conflict).
--
-- 001 chained purchases → profiles → auth.users with ON DELETE CASCADE, so
-- deleting an auth user would erase their purchase rows - but VAT/OSS
-- record-keeping obligations (~10 years) REQUIRE retaining the financial
-- records (amount, tax_country, customer_tax_id, dates). GDPR's right to
-- erasure explicitly yields to legal retention obligations (Art. 17(3)(b));
-- the deletion endpoint's carve-out is exactly this.
--
-- Change: user_id becomes nullable and the FK becomes ON DELETE SET NULL.
-- Account deletion then anonymizes the purchase (row survives, unlinked)
-- while every other user table cascades away as before. NULL user_id rows
-- are invisible to all access reads (they filter on auth.uid()/user_id) and
-- to the webhook's intent-matched updates.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

alter table public.purchases
  alter column user_id drop not null;

alter table public.purchases
  drop constraint if exists purchases_user_id_fkey;

alter table public.purchases
  add constraint purchases_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

comment on column public.purchases.user_id is
  'Null after account deletion: the financial record is retained for VAT/OSS obligations, unlinked from any person (migration 056).';

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (56, 'purchases_survive_account_deletion')
on conflict (version) do nothing;

commit;
