-- Down-migration for 052. Dropping these columns loses any provenance
-- recorded after the up ran — the exact loss 052 exists to prevent.

begin;

alter table public.purchases
  drop column if exists granted_by_org_id,
  drop column if exists entitlement_id,
  drop column if exists valid_until;

alter table public.certificates
  drop column if exists granted_by_org_id,
  drop column if exists entitlement_id;

delete from public.schema_migrations where version = 52;

commit;
