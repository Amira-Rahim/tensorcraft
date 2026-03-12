-- Tensorcraft Exercise Attempts Migration
-- Records individual exercise submissions for analytics and history.

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_slug text not null,
  lesson_id text not null,
  theme_id text not null,
  passed boolean not null default false,
  score integer not null default 0 check (score >= 0 and score <= 100),
  hints_used integer not null default 0 check (hints_used >= 0),
  solution_viewed boolean not null default false,
  submitted_code text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  attempted_at timestamptz not null default now()
);

alter table public.exercise_attempts enable row level security;

create policy "Users can view own attempts"
  on public.exercise_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.exercise_attempts for insert
  with check (auth.uid() = user_id);

-- Indexes for common queries
create index idx_exercise_attempts_user on public.exercise_attempts(user_id);
create index idx_exercise_attempts_lesson on public.exercise_attempts(user_id, lesson_id);
create index idx_exercise_attempts_exercise on public.exercise_attempts(user_id, exercise_slug);
