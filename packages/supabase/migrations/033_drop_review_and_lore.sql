-- Tensorcraft: Drop the review-queue and lore-drop features
--
-- Removes two cut features and all their underlying DB objects:
--   - Review queue / bandit-driven spaced-recall (migrations 027 + 028):
--     review_queue table + ε-greedy selector + SM-2-lite scheduler RPCs.
--   - Lore artifact drops (migration 032): lore_drops table + drop RPCs.
--
-- Migrations 029 (dispatch), 030 (boss beat), and 031 (counterfactual)
-- are intentionally left intact. Historical skill_events rows with
-- event_type = 'review_recall' are left in place as harmless data -
-- nothing reads them once the operator log is gone.

-- ── Review queue (027 + 028) ──────────────────────────────────────────
-- Functions first (they reference review_queue), then the table.
-- record_recall_attempt has two overloads: the original 5-arg form (027)
-- and the 6-arg form with p_was_explored added in 028. Drop both.
drop function if exists public.record_recall_attempt(text, text, text, boolean, text, boolean);
drop function if exists public.record_recall_attempt(text, text, text, boolean, text);
drop function if exists public.get_review_queue(text, integer);
drop function if exists public.get_bandit_state_summary(text);
drop function if exists public.enqueue_review(text, text, text);
drop function if exists public.review_queue_epsilon();

drop table if exists public.review_queue cascade;

-- ── Lore drops (032) ──────────────────────────────────────────────────
drop function if exists public.try_drop_lore_artifact(text);
drop function if exists public.mark_lore_read(text);

drop table if exists public.lore_drops cascade;
