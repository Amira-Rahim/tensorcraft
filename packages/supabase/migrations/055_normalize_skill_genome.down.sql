-- Down-migration for 055: restore the 039/014 scoring (raw * 2, clamped).
-- Re-opens T1-21: every completed theme pins its axes at 100 again.

begin;


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

-- Same grants as 039: no anonymous genome.
revoke execute on function public.compute_user_skill_genome(uuid, text)
  from public, anon;

grant execute on function public.compute_user_skill_genome(uuid, text)
  to authenticated, service_role;

delete from public.schema_migrations where version = 55;

commit;
