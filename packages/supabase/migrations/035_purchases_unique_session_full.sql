-- Tensorcraft: make the stripe_session_id unique index FULL, not partial.
--
-- Migration 017 created:
--   create unique index idx_purchases_stripe_unique
--     on public.purchases (stripe_session_id)
--     where stripe_session_id is not null;
--
-- The webhook upsert uses `ON CONFLICT (stripe_session_id)` with no WHERE
-- predicate (apps/api/src/routes/payments.ts). Postgres arbiter inference
-- for a PARTIAL unique index requires the conflict target to carry the
-- index predicate; without it the statement can fail with:
--   42P10: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification
-- which would 500 every purchase webhook (customer charged, no access).
--
-- A FULL unique index is safe here: Postgres treats NULLs as distinct, so
-- rows without a Stripe session (manual grants / auto-grants) may coexist,
-- while any non-null session id is deduplicated and serves as a valid
-- ON CONFLICT arbiter.

drop index if exists public.idx_purchases_stripe_unique;

create unique index if not exists idx_purchases_stripe_unique
  on public.purchases (stripe_session_id);
