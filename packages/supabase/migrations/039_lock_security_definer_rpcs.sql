-- Tensorcraft: close the remaining SECURITY DEFINER holes.
--
-- Migration 036 documented this vulnerability class exactly ("no REVOKE was
-- ever issued, and Postgres grants EXECUTE on functions to PUBLIC by default
-- — PostgREST therefore exposes it at /rest/v1/rpc/<name> to anon and
-- authenticated alike") and then fixed precisely ONE function. Every other
-- SECURITY DEFINER function in the schema stayed world-callable. This closes
-- the rest.
--
-- The Hono rate limiter in apps/api does NOT protect this surface: PostgREST
-- is a separate public endpoint reached with the anon key, which ships to the
-- browser in NEXT_PUBLIC_SUPABASE_ANON_KEY.
--
-- Audited and deliberately LEFT callable, because each derives the caller
-- from auth.uid() and rejects an anonymous one:
--   record_streak_activity(text)   -- 008/012, raises 'Not authenticated'
--   mark_dispatch_read(uuid)       -- 029, raises 'Not authenticated'
--   count_unread_dispatch()        -- 029, returns 0 when unauthenticated
-- And intentionally public, since it powers the no-auth shared certificate
-- page:
--   get_shared_certificate(uuid)   -- 019

-- ============================================================
-- 1. refresh_dashboard_stats() — denial of service
-- ============================================================
-- No arguments, no auth guard, and it forces REFRESH MATERIALIZED VIEW
-- CONCURRENTLY over the whole theme_progress table. A single anonymous POST
-- in a loop pegs the database indefinitely. It has no application caller;
-- the only legitimate caller is a scheduled job running as service_role.

revoke execute on function public.refresh_dashboard_stats()
  from public, anon, authenticated;

grant execute on function public.refresh_dashboard_stats()
  to service_role;

-- ============================================================
-- 2. ensure_skill_events_partitions() — DDL execution
-- ============================================================
-- Executes DDL (CREATE TABLE ... PARTITION OF). Documented in 013 as
-- "Call monthly via pg_cron or Inngest" — a service-role job, never a client.
-- No application caller exists.

revoke execute on function public.ensure_skill_events_partitions()
  from public, anon, authenticated;

grant execute on function public.ensure_skill_events_partitions()
  to service_role;

-- ============================================================
-- 3. compute_user_skill_genome(uuid, text) — IDOR
-- ============================================================
-- This one CANNOT simply be revoked: it has a legitimate browser caller at
-- apps/web/lib/progress-client.ts:124, fired after each lesson completion.
--
-- The defect is that p_user_id was a free parameter on a SECURITY DEFINER
-- function reachable from the public PostgREST endpoint, with no ownership
-- check — so any caller could recompute, and thereby overwrite, ANY user's
-- skill genome, at ~19 table scans per call.
--
-- Body below is byte-identical to migration 014 apart from the guard block
-- at the top. The client already passes its own user.id, so the guard is
-- transparent to the existing call site.

create or replace function public.compute_user_skill_genome(
  p_user_id uuid,
  p_theme_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_caller uuid := auth.uid();
  v_axis record;
  v_score numeric;
  v_confidence numeric;
  v_old_proficiency numeric;
  v_velocity numeric;
BEGIN
  -- Ownership guard (added 039). Anonymous callers are rejected outright;
  -- authenticated callers may only target themselves.
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_user_id <> v_caller THEN
    RAISE EXCEPTION 'Cannot compute skill genome for another user';
  END IF;

  FOR v_axis IN
    SELECT DISTINCT skill_axis FROM skill_events
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND created_at > now() - interval '90 days'
  LOOP
    SELECT COALESCE(SUM(
      CASE event_type
        WHEN 'exercise_pass' THEN 3
        WHEN 'lesson_complete' THEN 2
        WHEN 'bridge_interaction' THEN 1
        WHEN 'review_recall' THEN 1
        WHEN 'exercise_fail' THEN -0.5
        WHEN 'hint_reveal' THEN -0.25
        WHEN 'solution_view' THEN -1
        ELSE 0
      END
    ), 0) INTO v_score
    FROM skill_events
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND skill_axis = v_axis.skill_axis
      AND created_at > now() - interval '90 days';

    v_score := GREATEST(0, LEAST(100, v_score * 2));

    SELECT LEAST(1.0, count(*)::numeric / 50) INTO v_confidence
    FROM skill_events
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND skill_axis = v_axis.skill_axis
      AND created_at > now() - interval '90 days';

    SELECT COALESCE(proficiency, 0) INTO v_old_proficiency
    FROM skill_genome
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND skill_axis = v_axis.skill_axis;

    IF NOT FOUND THEN v_old_proficiency := 0; END IF;
    v_velocity := v_score - v_old_proficiency;

    INSERT INTO skill_genome (user_id, theme_id, skill_axis, proficiency, confidence, velocity)
    VALUES (p_user_id, p_theme_id, v_axis.skill_axis, v_score, v_confidence, v_velocity)
    ON CONFLICT (user_id, theme_id, skill_axis)
    DO UPDATE SET
      proficiency = EXCLUDED.proficiency,
      confidence = EXCLUDED.confidence,
      velocity = EXCLUDED.velocity,
      updated_at = now();
  END LOOP;
END;
$$;

-- anon loses access entirely: there is no such thing as an anonymous genome.
revoke execute on function public.compute_user_skill_genome(uuid, text)
  from public, anon;

grant execute on function public.compute_user_skill_genome(uuid, text)
  to authenticated, service_role;
