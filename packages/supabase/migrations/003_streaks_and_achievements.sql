-- Tensorcraft Streaks & Achievements Migration
-- Adds streak tracking and achievement system

-- ============================================================
-- STREAKS
-- Denormalized for fast dashboard reads.
-- ============================================================
create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now(),

  unique(user_id, theme_id)
);

alter table public.streaks enable row level security;

create policy "Users can view own streaks"
  on public.streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on public.streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on public.streaks for update
  using (auth.uid() = user_id);

create index idx_streaks_user on public.streaks(user_id);

create trigger streaks_updated_at
  before update on public.streaks
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- ACHIEVEMENTS
-- Milestones and badges unlocked by users.
-- ============================================================
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_type text not null,
  theme_id text,
  unlocked_at timestamptz not null default now(),

  unique(user_id, achievement_type, theme_id)
);

alter table public.achievements enable row level security;

create policy "Users can view own achievements"
  on public.achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on public.achievements for insert
  with check (auth.uid() = user_id);

create index idx_achievements_user on public.achievements(user_id);
