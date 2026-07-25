-- Tensorcraft: drop the skill_events_old duplicate (Tier 1-OPS
-- migration-safety item, verified 2026-07-25).
--
-- Migration 013 rebuilt skill_events as a partitioned table and renamed the
-- original to skill_events_old, with the DROP commented out "pending manual
-- verification" — which never happened, and the register warned production
-- may carry a full duplicate. Verified against production via PostgREST on
-- 2026-07-25: the table EXISTS and holds ZERO rows (content-range */0).
-- Nothing references it in code (grep clean). Dropping is a no-data-loss
-- cleanup that also removes a PostgREST-addressable relation nobody audits.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

drop table if exists public.skill_events_old;

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (57, 'drop_skill_events_old')
on conflict (version) do nothing;

commit;
