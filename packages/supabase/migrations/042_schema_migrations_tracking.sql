-- Tensorcraft: migration ledger + backfill of the 001-041 backlog.
--
-- Before this, there was no record of which migrations had been applied to
-- production (see docs/audits/scalability-architecture-2026-07-21.md, Tier 0).
-- This creates the ledger and seeds it with every prior migration so
-- `scripts/migration-status.mjs` reports a truthful diff from day one.
--
-- SELF-REGISTERING: this is the first migration to follow the new conventions
-- (packages/supabase/migrations/CONVENTIONS.md) — transaction wrapped,
-- idempotent, records its own version, and ships a paired .down.sql.

begin;

create table if not exists public.schema_migrations (
  version    integer primary key,
  name       text not null,
  applied_at timestamptz not null default now()
);

comment on table public.schema_migrations is
  'Applied-migration ledger. One row per numbered migration file. '
  'Source of truth for "what is live"; the migrations/ directory is the '
  'source of truth for "what exists". scripts/migration-status.mjs diffs them.';

-- Lock it down: this is operational metadata, not user data. Only the service
-- role (used by the SQL editor / any future CI applier) may touch it. No
-- PostgREST exposure to anon/authenticated.
alter table public.schema_migrations enable row level security;
revoke all on public.schema_migrations from anon, authenticated;

-- Backfill 001-041. These pre-date the conventions and are grandfathered; we
-- record them as applied so the ledger is not misleadingly empty. If your
-- production DB is in fact behind (some of these unapplied), correct the ledger
-- by deleting the rows for the versions you have NOT applied, then apply them.
-- The names are abbreviated from the filenames.
insert into public.schema_migrations (version, name) values
  (1,  'initial_schema'),
  (2,  'schema_hardening'),
  (3,  'streaks_and_achievements'),
  (4,  'exercise_attempts'),
  (5,  'progress_summary_view'),
  (6,  'admin_roles'),
  (7,  'notification_prefs'),
  (8,  'secure_streaks'),
  (9,  'schema_hardening_2'),
  (10, 'skill_genome'),
  (11, 'fix_github_token_and_purchase_enum'),
  (12, 'scalability_indexes'),
  (13, 'skill_events_partitioning'),
  (14, 'skill_genome_computation'),
  (15, 'avatars_storage_bucket'),
  (16, 'theme_id_check'),
  (17, 'purchases_referential_integrity'),
  (18, 'onboarding_fields'),
  (19, 'certificates'),
  (20, 'issues_table'),
  (21, 'fix_admin_policy_recursion'),
  (22, 'backfill_profiles'),
  (23, 'admin_role_assignment'),
  (24, 'news_items'),
  (25, 'waitlist_subscribed'),
  (26, 'news_items_content_gap'),
  (27, 'review_queue'),
  (28, 'recall_explore_capture'),
  (29, 'dispatch_messages'),
  (30, 'boss_beat_choices'),
  (31, 'counterfactual_choices'),
  (32, 'lore_drops'),
  (33, 'drop_review_and_lore'),
  (34, 'react_only_framework'),
  (35, 'purchases_unique_session_full'),
  (36, 'lock_dispatch_milestone'),
  (37, 'allow_zero_amount_purchases'),
  (38, 'prevent_status_regression'),
  (39, 'lock_security_definer_rpcs'),
  (40, 'fix_privilege_escalation_and_view_leaks'),
  (41, 'skill_events_insert_and_integrity_constraints')
on conflict (version) do nothing;

insert into public.schema_migrations (version, name)
values (42, 'schema_migrations_tracking')
on conflict (version) do nothing;

commit;
