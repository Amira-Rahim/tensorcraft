-- Tensorcraft Schema Hardening Migration
-- Addresses audit findings: missing columns, CHECK constraints, UNIQUE constraint
--
-- Run via: supabase db push
-- Or manually in Supabase SQL editor

-- ============================================================
-- PROFILES: Add missing columns
-- ============================================================

-- Persist onboarding theme selection (currently lost in React state)
alter table public.profiles
  add column if not exists preferred_theme_id text;

-- Needed for streak calculation and "welcome back" UI
alter table public.profiles
  add column if not exists last_active_at timestamptz;

-- Denormalized counter for dashboard display
alter table public.profiles
  add column if not exists total_lessons_completed integer not null default 0;

-- ============================================================
-- THEME_PROGRESS: Add CHECK constraints
-- ============================================================

-- Score must be between 0 and 100
alter table public.theme_progress
  add constraint chk_score_range
  check (score is null or (score >= 0 and score <= 100));

-- hints_used must be non-negative
alter table public.theme_progress
  add constraint chk_hints_used_positive
  check (hints_used >= 0);

-- attempts must be non-negative
alter table public.theme_progress
  add constraint chk_attempts_positive
  check (attempts >= 0);

-- ============================================================
-- PURCHASES: Add constraints
-- ============================================================

-- Prevent duplicate webhook processing
alter table public.purchases
  add constraint uq_stripe_session_id
  unique (stripe_session_id);

-- Amount must be positive
alter table public.purchases
  add constraint chk_amount_positive
  check (amount > 0);
