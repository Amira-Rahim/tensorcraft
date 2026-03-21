-- Tensorcraft: Skill Genome & Adaptive Bridges
-- Adds skill tracking foundation and framework personalization.
--
-- Tables: skill_genome (future proficiency), skill_events (signal log)
-- Columns: profiles.fe_background, fe_framework, learning_goal, fe_experience_years

-- ============================================================
-- SKILL GENOME
-- Per-user, per-skill proficiency tracker.
-- Pre-created for V0.8+ proficiency computation; empty at V0.5.
-- ============================================================
create table public.skill_genome (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  skill_axis text not null check (skill_axis in (
    'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
  )),
  proficiency numeric(5,2) not null default 0.00 check (proficiency >= 0 and proficiency <= 100),
  confidence numeric(3,2) not null default 0.00 check (confidence >= 0 and confidence <= 1),
  velocity numeric(5,2) not null default 0.00 check (velocity between -100.00 and 100.00),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique(user_id, theme_id, skill_axis)
);

alter table public.skill_genome enable row level security;

create policy "Users can view own genome"
  on public.skill_genome for select
  using (auth.uid() = user_id);

-- Genome rows are managed by the server (service role) via recompute functions.
-- No client-side insert/update policies.

create index idx_skill_genome_user on public.skill_genome(user_id);
create index idx_skill_genome_user_theme on public.skill_genome(user_id, theme_id);

create trigger skill_genome_updated_at
  before update on public.skill_genome
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- SKILL EVENTS
-- Append-only log of every learning signal.
-- Feeds future proficiency computation; at V0.5 it just logs.
-- ============================================================
create table public.skill_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  event_type text not null check (event_type in (
    'exercise_pass', 'exercise_fail', 'hint_reveal', 'solution_view',
    'lesson_complete', 'bridge_interaction', 'review_recall'
  )),
  skill_axis text not null check (skill_axis in (
    'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
  )),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.skill_events enable row level security;

create policy "Users can view own events"
  on public.skill_events for select
  using (auth.uid() = user_id);

-- Events are inserted server-side (service role) from the API.
-- No client-side insert policy.

create index idx_skill_events_user on public.skill_events(user_id);
create index idx_skill_events_user_theme on public.skill_events(user_id, theme_id);
create index idx_skill_events_user_axis on public.skill_events(user_id, skill_axis);
create index idx_skill_events_created on public.skill_events(created_at);

-- ============================================================
-- PROFILES: Onboarding & Framework Preferences
-- Persist data currently lost in React state.
-- ============================================================
alter table public.profiles
  add column if not exists fe_background text,
  add column if not exists learning_goal text,
  add column if not exists fe_framework text check (fe_framework in ('react', 'vue', 'angular', 'svelte', 'vanilla')),
  add column if not exists fe_experience_years integer check (fe_experience_years >= 0 and fe_experience_years <= 50);
