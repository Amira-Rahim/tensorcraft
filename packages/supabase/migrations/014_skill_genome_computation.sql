-- Tensorcraft: Skill Genome Computation Function
--
-- Aggregates skill_events into skill_genome proficiency scores.
-- Called via RPC after lesson completion (fire-and-forget).

CREATE OR REPLACE FUNCTION public.compute_user_skill_genome(
  p_user_id uuid,
  p_theme_id text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_axis record;
  v_score numeric;
  v_confidence numeric;
  v_old_proficiency numeric;
  v_velocity numeric;
BEGIN
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
