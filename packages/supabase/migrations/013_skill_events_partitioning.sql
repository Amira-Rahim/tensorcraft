-- Tensorcraft: Scalability Phase 1 — skill_events Partitioning
--
-- Converts skill_events to a monthly-partitioned table.
-- Requires brief write pause during the atomic swap.
-- Creates 6 months of partitions (March–August 2026).
--
-- NOTE: Run this migration during a maintenance window.
-- The swap (Step 6) acquires an ACCESS EXCLUSIVE lock briefly.

-- Step 1: Create new partitioned table
-- NOTE: Postgres requires the partition key (created_at) in the PRIMARY KEY.
-- No other table references skill_events.id, so this shape change is safe.
CREATE TABLE public.skill_events_new (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'exercise_pass','exercise_fail','hint_reveal','solution_view',
    'lesson_complete','bridge_interaction','review_recall'
  )),
  skill_axis text NOT NULL CHECK (skill_axis IN (
    'data_prep','model_arch','training','evaluation','deployment','fe_integration'
  )),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Step 2: Create monthly partitions (catch-all for pre-March + 6 months ahead)
CREATE TABLE public.skill_events_before_2026_03 PARTITION OF public.skill_events_new
  FOR VALUES FROM (MINVALUE) TO ('2026-03-01');
CREATE TABLE public.skill_events_2026_03 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.skill_events_2026_04 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.skill_events_2026_05 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.skill_events_2026_06 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.skill_events_2026_07 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.skill_events_2026_08 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- Step 3: Copy existing data
INSERT INTO public.skill_events_new
  SELECT * FROM public.skill_events;

-- Step 4: Recreate RLS
ALTER TABLE public.skill_events_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events"
  ON public.skill_events_new FOR SELECT
  USING (auth.uid() = user_id);

-- Step 5: Recreate indexes (auto-created per partition)
CREATE INDEX ON public.skill_events_new(user_id);
CREATE INDEX ON public.skill_events_new(user_id, theme_id);
CREATE INDEX ON public.skill_events_new(user_id, created_at DESC);

-- Step 6: Atomic swap
ALTER TABLE public.skill_events RENAME TO skill_events_old;
ALTER TABLE public.skill_events_new RENAME TO skill_events;

-- Step 7: Drop old table (run manually after verification)
-- DROP TABLE public.skill_events_old;
