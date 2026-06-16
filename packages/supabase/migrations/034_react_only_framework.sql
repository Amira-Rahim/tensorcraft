-- Tensorcraft: Constrain fe_framework to React only (V1 launch scope)
--
-- V1 ships React as the only supported frontend bridge framework. The
-- vue / angular / svelte / vanilla options are gone from onboarding, the
-- Framework type, the bridge registry, and the API validator. This migration
-- brings the DB in line:
--   1. Normalize any existing non-react fe_framework values to 'react'.
--   2. Replace the original CHECK constraint from migration 010
--      (inline `check (fe_framework in ('react','vue','angular','svelte',
--      'vanilla'))`, auto-named `profiles_fe_framework_check`) with one that
--      allows only 'react' (and NULL).
--
-- The column itself is kept (tombstone-friendly): new profiles still default
-- to 'react' via the onboarding PATCH payload.

-- ── 1. Normalize existing values ──────────────────────────────────────
update public.profiles
set fe_framework = 'react'
where fe_framework is not null
  and fe_framework <> 'react';

-- ── 2. Swap the CHECK constraint ──────────────────────────────────────
-- Drop the original column-level check from migration 010 (Postgres names
-- inline column checks `<table>_<column>_check`). `if exists` keeps this
-- migration idempotent in dev environments.
alter table public.profiles
  drop constraint if exists profiles_fe_framework_check;

-- Also drop our own named constraint if a prior run already created it.
alter table public.profiles
  drop constraint if exists chk_profiles_fe_framework;

alter table public.profiles
  add constraint chk_profiles_fe_framework
  check (
    fe_framework is null
    or fe_framework = 'react'
  );
