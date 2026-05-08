-- Tensorcraft: Review Queue (Bandit-Driven Spaced Recall)
--
-- Per-user, per-lesson bandit state for spaced recall scheduling.
-- The selector function uses ε-greedy (ε = 0.15) over due lessons.
-- This is the same algorithm taught in:
--   packages/content/content/terra-grid/ab-testing/05-multi-armed-bandits.mdx
--
-- Tables: review_queue
-- RPCs: get_review_queue, record_recall_attempt
-- Events emitted: skill_events.review_recall (uses existing schema from 010)

-- ============================================================
-- REVIEW QUEUE TABLE
-- ============================================================
create table public.review_queue (
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  module_id text not null,
  lesson_id text not null,
  arm_pulls integer not null default 0 check (arm_pulls >= 0),
  arm_successes integer not null default 0 check (arm_successes >= 0 and arm_successes <= arm_pulls),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now() + interval '1 day',
  created_at timestamptz not null default now(),

  primary key (user_id, theme_id, lesson_id)
);

create index idx_review_queue_due
  on public.review_queue (user_id, theme_id, next_review_at)
  where next_review_at <= now();

alter table public.review_queue enable row level security;

create policy "Users can view own review queue"
  on public.review_queue for select
  using (auth.uid() = user_id);

-- All writes go through SECURITY DEFINER RPCs below. No client write policies.

-- ============================================================
-- ε-GREEDY BANDIT EPSILON (single source of truth)
-- ============================================================
-- 0.15 matches the value taught in the bandit lesson and rendered by
-- the <BanditState /> component on that lesson's "You're Inside a Bandit
-- Right Now" section. Change here, change lesson, change component.
create or replace function public.review_queue_epsilon()
returns numeric language sql immutable as $$
  select 0.15::numeric;
$$;

-- ============================================================
-- ENQUEUE: called from progress-client.markLessonCompleted
-- ============================================================
-- Idempotent on conflict: if user re-completes a lesson (e.g. after a
-- review attempt), we DO NOT overwrite next_review_at — that would cancel
-- the spaced schedule. Only insert on first completion.
create or replace function public.enqueue_review(
  p_theme_id text,
  p_module_id text,
  p_lesson_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.review_queue (user_id, theme_id, module_id, lesson_id, next_review_at)
  values (v_user_id, p_theme_id, p_module_id, p_lesson_id, now() + interval '1 day')
  on conflict (user_id, theme_id, lesson_id) do nothing;
end;
$$;

-- ============================================================
-- SELECTOR: ε-greedy over due lessons for a single theme
-- ============================================================
-- Per-arm Bernoulli: each due row independently rolls.
--   random() < ε  → explore key  = random()
--   else          → exploit key = forgetting_score
-- forgetting_score = (1 - success_rate) * hours_since_review
--   where success_rate = arm_successes / max(arm_pulls, 1) (=0 for unpulled)
--   capped at 24*30 hours to prevent ancient unreviewed lessons from
--   dominating forever.
-- Returns top p_limit rows by sort key descending.
create or replace function public.get_review_queue(
  p_theme_id text,
  p_limit integer default 5
) returns table (
  theme_id text,
  module_id text,
  lesson_id text,
  arm_pulls integer,
  arm_successes integer,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  was_explored boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_eps numeric := public.review_queue_epsilon();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  return query
  with scored as (
    select
      rq.theme_id,
      rq.module_id,
      rq.lesson_id,
      rq.arm_pulls,
      rq.arm_successes,
      rq.last_reviewed_at,
      rq.next_review_at,
      (random() < v_eps) as explore_flag,
      least(
        extract(epoch from (now() - coalesce(rq.last_reviewed_at, rq.created_at))) / 3600.0,
        24.0 * 30.0
      ) as hours_since,
      (1.0 - (rq.arm_successes::numeric / greatest(rq.arm_pulls, 1))) as failure_rate
    from public.review_queue rq
    where rq.user_id = v_user_id
      and rq.theme_id = p_theme_id
      and rq.next_review_at <= now()
  )
  select
    s.theme_id,
    s.module_id,
    s.lesson_id,
    s.arm_pulls,
    s.arm_successes,
    s.last_reviewed_at,
    s.next_review_at,
    s.explore_flag as was_explored
  from scored s
  order by
    case when s.explore_flag then random()
         else (s.failure_rate * s.hours_since)
    end desc
  limit greatest(p_limit, 1);
end;
$$;

-- ============================================================
-- RECORD ATTEMPT: called from review-client.recordRecallAttempt
-- ============================================================
-- Updates arm stats + reschedules via SM-2-lite:
--   success → next_review_at = now() + interval * 2.5
--   fail    → next_review_at = now() + interval '1 day'
-- where interval = max(now - last_reviewed_at, 1 day).
-- Also emits skill_events.review_recall with metadata={success, arm_pulls, arm_successes}.
-- p_skill_axis is required because skill_events.skill_axis has a check
-- constraint and varies by lesson; caller passes from lesson frontmatter.
create or replace function public.record_recall_attempt(
  p_theme_id text,
  p_module_id text,
  p_lesson_id text,
  p_success boolean,
  p_skill_axis text
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

  -- Validate skill_axis here because skill_events check constraint will
  -- otherwise reject the insert with a confusing error.
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

  -- Compute interval since last review (or since enqueue if never reviewed).
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

  -- Emit skill event so compute_user_skill_genome picks it up.
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
      'arm_pulls', v_existing.arm_pulls + 1,
      'arm_successes', v_existing.arm_successes + (case when p_success then 1 else 0 end)
    )
  );

  return v_next;
end;
$$;

-- ============================================================
-- BANDIT STATE SUMMARY: powers <BanditState /> component on bandit lesson
-- ============================================================
-- Returns a single row of aggregate stats so the bandit lesson can render
-- the user's actual ε / total pulls / total successes / due count.
create or replace function public.get_bandit_state_summary(
  p_theme_id text
) returns table (
  epsilon numeric,
  total_arms integer,
  total_pulls bigint,
  total_successes bigint,
  due_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    public.review_queue_epsilon() as epsilon,
    count(*)::integer as total_arms,
    coalesce(sum(arm_pulls), 0) as total_pulls,
    coalesce(sum(arm_successes), 0) as total_successes,
    count(*) filter (where next_review_at <= now()) as due_count
  from public.review_queue
  where user_id = v_user_id
    and theme_id = p_theme_id;
end;
$$;
