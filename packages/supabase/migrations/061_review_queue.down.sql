-- Reverses 061_review_queue.sql.
--
-- Dropping the table discards every learner's review schedule. That is
-- acceptable and the reason is worth recording: the queue is derived state.
-- Re-applying 061 and completing lessons rebuilds it, and nothing else reads
-- it, so no purchase, patch, certificate, or progress row depends on it.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped, idempotent, clears its ledger row.

begin;

drop policy if exists "Users can view own review queue" on public.review_queue;
drop policy if exists "Users can insert own review queue" on public.review_queue;
drop policy if exists "Users can update own review queue" on public.review_queue;

drop index if exists public.idx_review_queue_due;

drop table if exists public.review_queue cascade;

delete from public.schema_migrations where version = 61;

commit;
