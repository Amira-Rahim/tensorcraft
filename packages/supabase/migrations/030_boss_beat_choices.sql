-- Tensorcraft: Time-pressure boss-beat choices (Slice #6)
--
-- 30s-timed 4-option strategy choices at capstone moments. Each option
-- is a different game-theoretic stance (cooperate/defect/random/dominant).
-- Player choice + reaction time logged; later surfaced in operator log
-- (Slice #11) as part of the strategic-decision telemetry.
--
-- Idempotent: one row per (user_id, beat_id). Re-render in MDX shows the
-- already-chosen option instead of opening the timer modal again.

create table public.boss_beat_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  lesson_id text not null,
  beat_id text not null,
  choice_index int not null check (choice_index between 0 and 3),
  choice_label text not null check (choice_label in (
    'cooperate', 'defect', 'random', 'dominant'
  )),
  reaction_ms int check (reaction_ms is null or reaction_ms >= 0),
  chosen_at timestamptz not null default now(),
  unique (user_id, beat_id)
);

create index idx_boss_beat_choices_user
  on public.boss_beat_choices (user_id, theme_id);

alter table public.boss_beat_choices enable row level security;

create policy "Users view own boss-beat choices"
  on public.boss_beat_choices for select
  using (auth.uid() = user_id);

-- Idempotent recorder. ON CONFLICT DO NOTHING — first choice wins, can't
-- be replayed for a different outcome (no farming of a more dominant pick).
create or replace function public.record_boss_beat_choice(
  p_theme_id text,
  p_lesson_id text,
  p_beat_id text,
  p_choice_index int,
  p_choice_label text,
  p_reaction_ms int default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_choice_index < 0 or p_choice_index > 3 then
    raise exception 'choice_index out of range';
  end if;

  if p_choice_label not in ('cooperate', 'defect', 'random', 'dominant') then
    raise exception 'invalid choice_label';
  end if;

  insert into public.boss_beat_choices (
    user_id, theme_id, lesson_id, beat_id, choice_index, choice_label, reaction_ms
  )
  values (
    v_user_id, p_theme_id, p_lesson_id, p_beat_id, p_choice_index, p_choice_label, p_reaction_ms
  )
  on conflict (user_id, beat_id) do nothing;

  get diagnostics v_inserted = ROW_COUNT;
  return v_inserted;
end;
$$;

-- Prior-choice fetcher used by the MDX component to render the consequence
-- inline on revisit instead of re-opening the timer modal.
create or replace function public.get_boss_beat_choice(p_beat_id text)
returns table (
  beat_id text,
  choice_index int,
  choice_label text,
  reaction_ms int,
  chosen_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  return query
  select bbc.beat_id, bbc.choice_index, bbc.choice_label, bbc.reaction_ms, bbc.chosen_at
  from public.boss_beat_choices bbc
  where bbc.user_id = v_user_id and bbc.beat_id = p_beat_id;
end;
$$;
