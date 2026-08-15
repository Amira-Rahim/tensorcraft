-- Tensorcraft: content-gap flagging on news_items.
--
-- When the LLM rerank step in scripts/news/match.mjs returns picks=[] (i.e.
-- no candidate lesson actually teaches the news item's concept), we capture
-- the gap so the curator can use it as a curriculum backlog signal.
--
-- Three columns:
--   - is_content_gap - flag set by matcher when picks is empty.
--   - gap_concept - short description of what the news teaches that no
--                        lesson covers (LLM-extracted, ≤ 120 chars).
--   - gap_rationale - why this is a gap (LLM-extracted, ≤ 240 chars).
--                        Pattern: "Item teaches X; closest current lesson covers Y."
--
-- Backwards compatible: defaults keep all existing rows non-gap. Re-run the
-- matcher with the LLM enabled to populate the new columns on existing rows.

alter table public.news_items
  add column if not exists is_content_gap boolean not null default false;

alter table public.news_items
  add column if not exists gap_concept text;

alter table public.news_items
  add column if not exists gap_rationale text;

-- Curator dashboard reads /admin/digest?status=gap. Partial index keeps
-- it small in the steady state (most items aren't gaps).
create index if not exists idx_news_items_content_gap
  on public.news_items (is_content_gap, scraped_at desc)
  where is_content_gap = true;
