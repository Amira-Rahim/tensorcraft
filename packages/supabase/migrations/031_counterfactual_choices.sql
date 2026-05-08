-- Tensorcraft: Counterfactual rewind (Slice #3)
--
-- One-shot per-theme rewind. Player picks a single decision node from
-- their journey through a theme and sees the alternate timeline play out.
-- Hard cap at 1 rewind per (user_id, theme_id) — enforced in schema +
-- RPC. Once spent, the only way to "rewind again" is to revisit alternate
-- paths in a fresh theme.
--
-- Decision nodes are surfaced from boss_beat_choices + (future) quiz
-- branches. The rewind itself is purely narrative: it does not mutate
-- any prior choice in the original tables. The alternate timeline is
-- shown via MDX content scoped to (theme_id, decision_node, alt_choice).

create table public.counterfactual_choices (
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null,
  lesson_id text not null,
  decision_node text not null,        -- e.g. 'boss-beat:deep-orbit-launch-deploy-call'
  original_choice_index int not null check (original_choice_index between 0 and 3),
  alternate_choice_index int not null check (alternate_choice_index between 0 and 3),
  rewound_at timestamptz not null default now(),
  primary key (user_id, theme_id),
  check (original_choice_index <> alternate_choice_index)
);

create index idx_counterfactual_user
  on public.counterfactual_choices (user_id, theme_id);

alter table public.counterfactual_choices enable row level security;

create policy "Users view own counterfactuals"
  on public.counterfactual_choices for select
  using (auth.uid() = user_id);

-- Records the rewind. Server-enforced cap: ON CONFLICT DO NOTHING —
-- if a row already exists for (user_id, theme_id) the rewind is rejected.
create or replace function public.record_counterfactual(
  p_theme_id text,
  p_lesson_id text,
  p_decision_node text,
  p_original_choice_index int,
  p_alternate_choice_index int
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

  if p_original_choice_index = p_alternate_choice_index then
    raise exception 'Alternate must differ from original';
  end if;

  insert into public.counterfactual_choices (
    user_id, theme_id, lesson_id, decision_node,
    original_choice_index, alternate_choice_index
  )
  values (
    v_user_id, p_theme_id, p_lesson_id, p_decision_node,
    p_original_choice_index, p_alternate_choice_index
  )
  on conflict (user_id, theme_id) do nothing;

  get diagnostics v_inserted = ROW_COUNT;
  return v_inserted;
end;
$$;

-- Returns the rewind row if one exists for this (user, theme); empty
-- otherwise. Used by /log/rewind to show "you rewound theme X" state.
create or replace function public.get_counterfactual(p_theme_id text)
returns table (
  theme_id text,
  lesson_id text,
  decision_node text,
  original_choice_index int,
  alternate_choice_index int,
  rewound_at timestamptz
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
  select
    cc.theme_id, cc.lesson_id, cc.decision_node,
    cc.original_choice_index, cc.alternate_choice_index, cc.rewound_at
  from public.counterfactual_choices cc
  where cc.user_id = v_user_id and cc.theme_id = p_theme_id;
end;
$$;
