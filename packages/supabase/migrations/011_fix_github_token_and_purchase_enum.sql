-- Tensorcraft: Fix missing github_token column + purchase_status enum
--
-- CRITICAL #1: github_token column is referenced in api/routes/github.ts
--   but was never created in any migration. Adds it to profiles.
--
-- CRITICAL #2: Webhook code uses 'partially_refunded' and 'disputed'
--   statuses but the purchase_status enum only has 4 values.
--   PostgreSQL ALTER TYPE ... ADD VALUE cannot run in a transaction,
--   so we recreate the enum via a column swap approach.

-- ============================================================
-- FIX #1: Add github_token to profiles
-- ============================================================
alter table public.profiles
  add column if not exists github_token text;

-- ============================================================
-- FIX #2: Expand purchase_status enum
-- Approach: rename old enum, create new one, migrate column, drop old.
-- This avoids the "ADD VALUE cannot run in transaction" limitation.
-- ============================================================

-- Step 1: Rename the existing enum
alter type public.purchase_status rename to purchase_status_old;

-- Step 2: Create new enum with all values
create type public.purchase_status as enum (
  'pending',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'disputed'
);

-- Step 3: Migrate the column (default must be reapplied)
alter table public.purchases
  alter column status drop default,
  alter column status type public.purchase_status using status::text::public.purchase_status,
  alter column status set default 'pending';

-- Step 4: Drop old enum
drop type public.purchase_status_old;
