-- Tensorcraft: Capture was_explored flag at recall time
--
-- Slice #11 (Operator log meta-screen) needs the exploration ratio:
--   count(recalls explored) / count(total recalls).
--
-- Migration 027 returns `was_explored` from get_review_queue but
-- record_recall_attempt does not persist it. This migration:
--   1) Replaces record_recall_attempt with a version that takes
--      p_was_explored and includes it in skill_events.metadata.
--   2) Existing callers that omit p_was_explored continue to work
--      (default false) - backward-compatible for any cached client.

create or replace function public.record_recall_attempt(
  p_theme_id text,
  p_module_id text,
  p_lesson_id text,
  p_success boolean,
  p_skill_axis text,
  p_was_explored boolean default false
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing record;
  v_interval interval;
  v_next timestamptz;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_skill_axis not in (
    'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
  ) then
    raise exception 'Invalid skill_axis: %', p_skill_axis;
  end if;

  select arm_pulls, arm_successes, last_reviewed_at, created_at
  into v_existing
  from public.review_queue
  where user_id = v_user_id
    and theme_id = p_theme_id
    and lesson_id = p_lesson_id;

  if not found then
    raise exception 'Lesson not in review queue: % / %', p_theme_id, p_lesson_id;
  end if;

  v_interval := greatest(
    now() - coalesce(v_existing.last_reviewed_at, v_existing.created_at),
    interval '1 day'
  );

  if p_success then
    v_next := now() + (v_interval * 2.5);
  else
    v_next := now() + interval '1 day';
  end if;

  update public.review_queue
  set
    arm_pulls = arm_pulls + 1,
    arm_successes = arm_successes + (case when p_success then 1 else 0 end),
    last_reviewed_at = now(),
    next_review_at = v_next
  where user_id = v_user_id
    and theme_id = p_theme_id
    and lesson_id = p_lesson_id;

  insert into public.skill_events (user_id, theme_id, event_type, skill_axis, metadata)
  values (
    v_user_id,
    p_theme_id,
    'review_recall',
    p_skill_axis,
    jsonb_build_object(
      'lesson_id', p_lesson_id,
      'module_id', p_module_id,
      'success', p_success,
      'was_explored', p_was_explored,
      'arm_pulls', v_existing.arm_pulls + 1,
      'arm_successes', v_existing.arm_successes + (case when p_success then 1 else 0 end)
    )
  );

  return v_next;
end;
$$;
