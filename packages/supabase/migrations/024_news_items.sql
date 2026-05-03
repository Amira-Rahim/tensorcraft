-- Tensorcraft: News items table
--
-- Backing store for the weekly browser-ML news digest pipeline (see
-- scripts/news/scrape.mjs). Each row is one external news item discovered by
-- the scraper. The matcher script (scripts/news/match.mjs) populates
-- `matched_concepts` and `matched_lessons` so curators can shortlist via the
-- /admin/digest dashboard before the draft + publish stages.
--
-- Identity model:
--   - No user_id — items belong to the digest pipeline, not individual users.
--   - The admin dashboard reads/writes via the service role only. RLS is
--     enabled with zero user-facing policies; the service role bypasses RLS
--     for INSERT, SELECT, and UPDATE.
--
-- Lifecycle:
--   pending      — fresh from scraper, not yet curated
--   shortlisted  — curator picked for current week's digest
--   published    — appeared in a published blog post
--   rejected     — curator dropped it (kept for dedup so we don't re-surface)
--
-- Shape mirrors `Database["public"]["Tables"]["news_items"]` in
-- packages/supabase/src/types.ts (Row + Insert + Update).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),

  -- Source identifier so we can rebalance which feeds we trust.
  -- Free-text rather than enum so adding a source doesn't need a migration.
  -- Example values: "github:tensorflow/tfjs", "rss:web.dev",
  -- "hn", "arxiv:cs.LG".
  source text not null,

  -- Canonical URL of the news item. Unique to dedupe across re-scrapes.
  url text not null,

  title text not null,
  summary text not null default '',
  published_at timestamptz,

  -- Raw response payload from the source — kept for forensics if a match
  -- looks wrong and we need to re-derive concepts later.
  raw_json jsonb not null default '{}'::jsonb,

  -- Filled by scripts/news/match.mjs. matched_lessons is jsonb so it can
  -- carry per-lesson confidence + rationale produced by the LLM rerank.
  matched_concepts text[] not null default '{}',
  matched_lessons jsonb not null default '[]'::jsonb,

  status text not null default 'pending',

  -- ISO week label like "2026-W18". Set when an item is shortlisted so we
  -- can group items into the right weekly digest.
  week_iso text,

  scraped_at timestamptz not null default now(),
  curated_at timestamptz,
  published_blog_slug text,

  constraint chk_news_items_status
    check (status in ('pending', 'shortlisted', 'published', 'rejected')),

  constraint chk_news_items_url_nonempty
    check (char_length(url) > 0),

  constraint chk_news_items_title_nonempty
    check (char_length(title) > 0)
);

-- URL is the natural dedup key. Re-scrapes upsert by url.
create unique index if not exists uq_news_items_url
  on public.news_items (url);

-- Curator dashboard query: WHERE status = ? ORDER BY scraped_at DESC.
create index if not exists idx_news_items_status_scraped
  on public.news_items (status, scraped_at desc);

-- Weekly grouping for digest assembly.
create index if not exists idx_news_items_week
  on public.news_items (week_iso)
  where week_iso is not null;

-- ============================================================
-- RLS
--
-- Same shape as the issues table: RLS enabled, no user-facing policies.
-- Service role (used by the scraper script and the admin dashboard) bypasses
-- RLS. anon / authenticated clients cannot read or write directly.
-- ============================================================
alter table public.news_items enable row level security;

drop policy if exists "Users can view news_items" on public.news_items;
drop policy if exists "Users can insert news_items" on public.news_items;
