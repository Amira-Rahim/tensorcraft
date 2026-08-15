-- Tensorcraft: composite indexes for the dashboard hot-path sorts + the
-- reverse theme-ownership lookup.
--
-- Scalability re-audit 2026-07-24 (docs/audits/scalability-architecture-2026-07-21.md
-- §RE-AUDIT / N3). Three index gaps that are cheap to close now (near-empty
-- tables) and painful to add later against a live 100k-row DB:
--
--   1. dashboard/page.tsx filters theme_progress by user_id and
--      order("updated_at" desc) - the existing idx_progress_user_theme
--      (user_id, theme_id) satisfies the FILTER but not the SORT, so Postgres
--      index-scans the user's rows then sorts them on every dashboard load.
--   2. dashboard/page.tsx filters exercise_attempts by user_id and
--      order("attempted_at" desc).limit(800) - idx_exercise_attempts_user
--      (user_id) has the same filter-not-sort gap; a heavy learner sorts 10k+
--      rows per render.
--   3. entitlements.getEntitledThemes + payments.ts + pricing use
--      .contains("theme_ids", ...) reverse "who owns theme X" lookups;
--      purchases indexes only (user_id) and (stripe_session_id), so theme_ids
--      @> ... seq-scans at 100k rows. This is the query a seat-entitlement
--      check will lean on.
--
-- Added NOW, pre-scale, so a plain (transaction-wrapped, idempotent) CREATE
-- INDEX is instant on the near-empty tables. The "@100k rows" cost that the
-- audit flagged for CONCURRENTLY is exactly what building these early avoids;
-- CONCURRENTLY is unavailable inside a transaction and unnecessary here.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

-- ============================================================
-- Dashboard sort hot-paths: (user_id, <ts> DESC) turns the per-user
-- filter-then-sort into a single index-range scan.
-- ============================================================
create index if not exists idx_theme_progress_user_updated
  on public.theme_progress (user_id, updated_at desc);

create index if not exists idx_exercise_attempts_user_attempted
  on public.exercise_attempts (user_id, attempted_at desc);

-- ============================================================
-- Reverse theme-ownership: GIN over the text[] so `theme_ids @> ARRAY[...]`
-- (.contains) is an index probe, not a seq-scan. Default array opclass
-- supports the containment operator the resolver uses.
-- ============================================================
create index if not exists idx_purchases_theme_ids
  on public.purchases using gin (theme_ids);

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (45, 'dashboard_hotpath_indexes')
on conflict (version) do nothing;

commit;
