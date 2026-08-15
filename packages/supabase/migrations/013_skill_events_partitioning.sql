-- Tensorcraft: Scalability Phase 1 - skill_events Partitioning
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
CREATE TABLE public.skill_events_2026_09 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.skill_events_2026_10 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.skill_events_2026_11 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.skill_events_2026_12 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE public.skill_events_2027_01 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE public.skill_events_2027_02 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE public.skill_events_2027_03 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');

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

-- Step 8: Helper function to create future partitions.
-- Call monthly via pg_cron or Inngest to ensure partitions always exist
-- 3 months ahead. Prevents "no partition found" INSERT failures.
CREATE OR REPLACE FUNCTION public.ensure_skill_events_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month date;
  v_partition_name text;
  v_start text;
  v_end text;
BEGIN
  -- Create partitions for the next 3 months from today
  FOR i IN 0..2 LOOP
    v_month := date_trunc('month', current_date + (i || ' months')::interval);
    v_partition_name := 'skill_events_' || to_char(v_month, 'YYYY_MM');
    v_start := to_char(v_month, 'YYYY-MM-DD');
    v_end := to_char(v_month + interval '1 month', 'YYYY-MM-DD');

    -- Skip if partition already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = v_partition_name
    ) THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.skill_events FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, v_start, v_end
      );
    END IF;
  END LOOP;
END;
$$;
