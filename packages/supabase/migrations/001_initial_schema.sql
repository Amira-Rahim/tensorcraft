-- Tensorcraft Initial Schema
-- Run via Supabase dashboard or CLI: supabase db push
--
-- Tables: profiles, theme_progress, purchases, waitlist
-- All tables use RLS (Row Level Security).

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with app-specific fields.
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  github_username text,
  github_connected boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read and update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- THEME PROGRESS
-- Tracks learner progress per lesson within a theme.
-- ============================================================
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');

create table public.theme_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  module_id text not null,
  lesson_id text not null,
  status public.progress_status not null default 'not_started',
  score numeric(5,2),
  hints_used integer not null default 0,
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One progress record per user per lesson
  unique(user_id, theme_id, lesson_id)
);

alter table public.theme_progress enable row level security;

create policy "Users can view own progress"
  on public.theme_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.theme_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.theme_progress for update
  using (auth.uid() = user_id);

create trigger theme_progress_updated_at
  before update on public.theme_progress
  for each row execute procedure public.update_updated_at();

-- Indexes for common queries
create index idx_progress_user_theme on public.theme_progress(user_id, theme_id);
create index idx_progress_user_module on public.theme_progress(user_id, theme_id, module_id);

-- ============================================================
-- PURCHASES
-- Payment records from Stripe webhooks.
-- ============================================================
create type public.purchase_status as enum ('pending', 'completed', 'failed', 'refunded');

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null,
  theme_ids text[] not null default '{}',
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  stripe_session_id text,
  status public.purchase_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

-- Users can view their own purchases
create policy "Users can view own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

-- Only server (service role) can insert/update purchases via webhooks
-- No insert/update policies for anon/authenticated - handled server-side

create index idx_purchases_user on public.purchases(user_id);
create index idx_purchases_stripe on public.purchases(stripe_session_id);

-- ============================================================
-- WAITLIST
-- Email captures for theme interest / pre-launch.
-- ============================================================
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  theme_id text,
  source text,
  created_at timestamptz not null default now(),

  -- One signup per email per theme
  unique(email, theme_id)
);

alter table public.waitlist enable row level security;

-- Waitlist is insert-only from the public (no auth required for signup)
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

-- Only service role can read waitlist entries (for admin/analytics)
-- No select policy for anon/authenticated

create index idx_waitlist_theme on public.waitlist(theme_id);
create index idx_waitlist_email on public.waitlist(email);
