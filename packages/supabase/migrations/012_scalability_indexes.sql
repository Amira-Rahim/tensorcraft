-- Tensorcraft: Scalability Phase 1 — Indexes, Materialized View, Streak Fix
--
-- Adds missing indexes for dashboard/exercise queries at scale.
-- Creates materialized view for dashboard aggregation.
-- Fixes streak race condition with advisory lock.

-- ============================================================
-- MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_theme_date
  ON exercise_attempts(theme_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_skill_events_user_created
  ON skill_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_theme_progress_completed
  ON theme_progress(user_id, theme_id, status)
  WHERE status = 'completed';

-- ============================================================
-- MATERIALIZED VIEW: Dashboard Stats
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT
  user_id,
  theme_id,
  55 AS total_lessons,
  count(*) FILTER (WHERE status = 'completed') AS completed_lessons,
  count(*) FILTER (WHERE status = 'in_progress') AS in_progress_lessons,
  round(
    count(*) FILTER (WHERE status = 'completed')::numeric / 55.0 * 100, 1
  ) AS completion_pct,
  max(completed_at) AS last_activity
FROM theme_progress
GROUP BY user_id, theme_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user_theme
  ON dashboard_stats(user_id, theme_id);

REFRESH MATERIALIZED VIEW dashboard_stats;

-- ============================================================
-- STREAK RACE CONDITION FIX
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_streak_activity(p_theme_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_existing record;
  v_new_streak integer;
  v_new_longest integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(v_user_id::text),
    hashtext(p_theme_id)
  );

  SELECT current_streak, longest_streak, last_activity_date
  INTO v_existing
  FROM public.streaks
  WHERE user_id = v_user_id AND theme_id = p_theme_id;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, theme_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_user_id, p_theme_id, 1, 1, v_today);
    RETURN;
  END IF;

  IF v_existing.last_activity_date = v_today THEN
    RETURN;
  END IF;

  IF v_existing.last_activity_date = v_today - 1 THEN
    v_new_streak := v_existing.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_new_longest := GREATEST(v_existing.longest_streak, v_new_streak);

  UPDATE public.streaks
  SET current_streak = v_new_streak,
      longest_streak = v_new_longest,
      last_activity_date = v_today
  WHERE user_id = v_user_id AND theme_id = p_theme_id;
END;
$$;
