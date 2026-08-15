-- Down-migration for 047. Reverses 047_purchases_tax_capture.sql.
--
-- Drops the tax-capture columns. NOTE: any tax jurisdiction already recorded on
-- real sales is LOST on rollback and cannot be reconstructed - only roll back
-- before Stripe Tax has been used in production.

begin;

alter table public.purchases drop column if exists customer_tax_id;
alter table public.purchases drop column if exists tax_country;
alter table public.purchases drop column if exists tax_amount;

delete from public.schema_migrations where version = 47;

commit;
