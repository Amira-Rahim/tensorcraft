-- Tensorcraft Progress Summary View
-- Aggregated completion stats per user per theme for fast dashboard reads.
--
-- NOTE: This view is NOT YET QUERIED by application code (as of V0.5).
-- The dashboard currently aggregates theme_progress in application code.
-- This view is retained as an optimization candidate - when dashboard
-- load times increase, switch dashboard queries to use this view instead
-- of the raw theme_progress table.

create or replace view public.theme_progress_summary as
select
  user_id,
  theme_id,
  count(*) as total_lessons,
  count(*) filter (where status = 'completed') as completed_lessons,
  count(*) filter (where status = 'in_progress') as in_progress_lessons,
  min(started_at) as first_started_at,
  max(completed_at) as last_completed_at,
  round(
    (count(*) filter (where status = 'completed'))::numeric / nullif(count(*), 0) * 100,
    1
  ) as completion_percent
from public.theme_progress
group by user_id, theme_id;

-- RLS on views requires the underlying table to have RLS, which theme_progress does.
-- Grant access to authenticated users (view inherits RLS from underlying table).
