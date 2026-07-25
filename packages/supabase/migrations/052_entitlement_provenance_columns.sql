-- Tensorcraft: stamp WHO an entitlement came from before the data becomes
-- unrecoverable (fresh-eyes rerun §7, irreversible list #1 + #2).
--
-- Every purchases/certificates row is stamped only `user_id`. The moment
-- seats ship (roadmap H1/H3), "who paid for whom" for all PRIOR periods is
-- UNRECOVERABLE unless the columns exist from the first sale. Same for
-- time-bounded entitlements: `grep valid_until|granted_by migrations` had
-- zero hits. All three columns are nullable and unread by V1 code — cost
-- now is XS, retrofit cost is permanent data loss.
--
-- The org/entitlement TABLES are deliberately deferred; these are dangling
-- uuids until then, by design (the header comment on each column says so).
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

alter table public.purchases
  add column if not exists granted_by_org_id uuid,
  add column if not exists entitlement_id uuid,
  add column if not exists valid_until timestamptz;

comment on column public.purchases.granted_by_org_id is
  'Seat purchases: the org that paid. Null for self-purchases. Table deferred; column exists so day-one rows carry provenance (migration 052).';
comment on column public.purchases.entitlement_id is
  'Forward-reference to the future entitlements table. Null in V1 (migration 052).';
comment on column public.purchases.valid_until is
  'Time-bounded access (subscriptions/seats). Null = perpetual, the V1 semantics (migration 052).';

alter table public.certificates
  add column if not exists granted_by_org_id uuid,
  add column if not exists entitlement_id uuid;

comment on column public.certificates.granted_by_org_id is
  'Seat-granted certificate provenance. Null for self-purchases (migration 052).';
comment on column public.certificates.entitlement_id is
  'Forward-reference to the future entitlements table. Null in V1 (migration 052).';

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (52, 'entitlement_provenance_columns')
on conflict (version) do nothing;

commit;
