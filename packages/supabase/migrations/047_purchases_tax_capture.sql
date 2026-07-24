-- Tensorcraft: capture tax jurisdiction + amount on every purchase.
--
-- Scalability re-audit 2026-07-24 (§RE-AUDIT / N0). This is the single most
-- retrofit-exponential item across all axes: EU VAT is owed at the buyer's rate
-- from the FIRST sale, and you cannot reconstruct a past buyer's country or the
-- VAT you should have charged from a flat USD charge row. Adding these columns
-- now (nullable, additive) means the webhook can record jurisdiction the moment
-- Stripe Tax is enabled — before volume exists.
--
-- All three columns are nullable and stay NULL until the operator enables
-- Stripe Tax (STRIPE_TAX_ENABLED=true) after configuring Tax + OSS/VAT
-- registration in the dashboard. The webhook (payments.ts) already writes them
-- best-effort, so no backfill of existing rows is required or possible.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

alter table public.purchases
  add column if not exists tax_amount numeric;
alter table public.purchases
  add column if not exists tax_country text;
alter table public.purchases
  add column if not exists customer_tax_id text;

comment on column public.purchases.tax_amount is
  'Tax charged on this sale (major currency units), from Stripe total_details.'
  ' NULL until Stripe Tax is enabled (re-audit N0).';
comment on column public.purchases.tax_country is
  'Buyer billing country (ISO code) at time of sale — the VAT jurisdiction.'
  ' NULL until address collection / Stripe Tax is enabled.';
comment on column public.purchases.customer_tax_id is
  'Buyer VAT / tax id if provided at checkout (B2B). NULL otherwise.';

insert into public.schema_migrations (version, name)
values (47, 'purchases_tax_capture')
on conflict (version) do nothing;

commit;
