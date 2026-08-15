-- Tensorcraft: Purchases ↔ themes referential integrity
--
-- Dev-plan §6h line 533:
--   "Purchase-to-theme referential integrity - validate `theme_ids[]`
--    against known themes"
--
-- The API layer already validates theme slugs on checkout and webhook
-- write (see apps/api/src/routes/payments.ts → validateThemeIds). This
-- migration enforces the same invariant at the database level so that
-- direct SQL writes, admin tooling, or a future bug in the API can
-- never land an unknown slug in `purchases.theme_ids`.
--
-- Additionally, add a UNIQUE constraint on `stripe_session_id` so that
-- the webhook's `ON CONFLICT (stripe_session_id) DO UPDATE` upsert is
-- guaranteed to serialize concurrent Stripe retries at the DB level
-- (dev-plan §338 "Fix upsert race condition").

-- ============================================================
-- FIX #1: Enforce UNIQUE on stripe_session_id
-- The idx_purchases_stripe index (migration 001) is non-unique,
-- which means two concurrent inserts can each succeed. Promoting
-- it to a UNIQUE index makes the `ON CONFLICT` upsert deterministic
-- and duplicate-free under Stripe webhook retries.
-- ============================================================

-- Drop the old non-unique index, replace with a unique index.
drop index if exists public.idx_purchases_stripe;

create unique index if not exists idx_purchases_stripe_unique
  on public.purchases (stripe_session_id)
  where stripe_session_id is not null;

-- ============================================================
-- FIX #2: CHECK constraint - every element of theme_ids must be
-- a canonical theme slug. NULLs / empty arrays are allowed only
-- for legacy rows; new rows written by the API will always include
-- at least one valid slug (enforced in validateThemeIds()).
--
-- We use `<@` (array-contained-by) against a hard-coded array of
-- canonical slugs. This keeps the check inline and deterministic
-- without needing a reference table.
-- ============================================================

alter table public.purchases
  add constraint chk_purchases_valid_theme_ids
  check (
    theme_ids is null
    or theme_ids <@ array[
      'deep-orbit',
      'neon-protocol',
      'signal-ward',
      'nova-canvas',
      'terra-grid'
    ]::text[]
  );

-- ============================================================
-- Note on future theme additions:
-- When new themes launch, update the array above via a new
-- migration that DROPs and re-ADDs the constraint. This keeps the
-- canonical slug list visible in the migration history.
-- ============================================================
