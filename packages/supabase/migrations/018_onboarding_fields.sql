-- Tensorcraft: Additional onboarding fields on profiles
--
-- Phase 11 §11e - backend for the onboarding survey + dashboard.
--
-- Adds:
--   - experience_level  (beginner | intermediate | advanced | expert)
--   - learning_goal CHECK constraint (hobby | career | research | team | curiosity)
--
-- `fe_background`, `fe_framework`, and `fe_experience_years` were added in
-- migration 010. `learning_goal` was added in 010 without a CHECK; we now
-- formalize the set of allowed values.

-- ============================================================
-- experience_level - new column
-- ============================================================
alter table public.profiles
  add column if not exists experience_level text;

-- Drop any prior constraint with the same name so this migration is
-- idempotent if re-run in a dev environment.
alter table public.profiles
  drop constraint if exists chk_profiles_experience_level;

alter table public.profiles
  add constraint chk_profiles_experience_level
  check (
    experience_level is null
    or experience_level in ('beginner', 'intermediate', 'advanced', 'expert')
  );

-- ============================================================
-- learning_goal - enforce allowed values
--
-- NOTE: The existing onboarding page (apps/web/app/onboarding/page.tsx)
-- writes free-text strings like "Switch to ML engineering". Stage 3 of
-- Phase 11 will update that UI to write canonical enum values. Until
-- then, any rows whose learning_goal does not match one of the five
-- canonical values are normalized to NULL so the CHECK can land.
-- ============================================================

update public.profiles
set learning_goal = null
where learning_goal is not null
  and learning_goal not in ('hobby', 'career', 'research', 'team', 'curiosity');

alter table public.profiles
  drop constraint if exists chk_profiles_learning_goal;

alter table public.profiles
  add constraint chk_profiles_learning_goal
  check (
    learning_goal is null
    or learning_goal in ('hobby', 'career', 'research', 'team', 'curiosity')
  );
