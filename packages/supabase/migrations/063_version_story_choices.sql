begin;

-- Existing rows describe the original wording. Never overwrite that intent.
alter table public.boss_beat_choices add column if not exists content_version integer not null default 1;
alter table public.boss_beat_choices drop constraint if exists boss_beat_choices_content_version_check;
alter table public.boss_beat_choices add constraint boss_beat_choices_content_version_check check (content_version in (1, 2));

create or replace function public.record_boss_beat_choice_versioned(
  p_world_id text, p_lesson_id text, p_beat_id text,
  p_choice_index integer, p_choice_label text, p_content_version integer,
  p_reaction_ms integer default null
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson text;
  v_max_version integer;
  v_inserted integer;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  select lesson, max_version into v_lesson, v_max_version from (values
    ('deep-orbit-foundations-7741-first-flag', 'normalization', 2),
    ('deep-orbit-anomaly-7741-training-set', 'normal-vs-anomalous', 1),
    ('deep-orbit-llm-cut-call', 'report-generation', 1),
    ('deep-orbit-cache-policy', 'caching-strategies', 1),
    ('deep-orbit-drift-response', 'monitoring', 2),
    ('deep-orbit-launch-deploy-call', 'launch', 1)
  ) as catalog(beat, lesson, max_version) where beat = p_beat_id;
  if p_world_id is distinct from 'deep-orbit' or v_lesson is null or p_lesson_id is distinct from v_lesson
    then raise exception 'Unknown decision context'; end if;
  if p_content_version is null or p_content_version < 1 or p_content_version > v_max_version
    then raise exception 'Unsupported decision version'; end if;
  if p_choice_index is null or p_choice_index not between 0 and 3 or
     p_choice_label is distinct from (array['cooperate','defect','random','dominant'])[p_choice_index + 1]
    then raise exception 'Choice index and label do not match'; end if;
  if p_reaction_ms < 0 then raise exception 'Invalid reaction time'; end if;
  insert into public.boss_beat_choices(user_id, world_id, lesson_id, beat_id, choice_index, choice_label, reaction_ms, content_version)
    values (v_user_id, p_world_id, p_lesson_id, p_beat_id, p_choice_index, p_choice_label, p_reaction_ms, p_content_version)
    on conflict (user_id, beat_id) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end $$;

create or replace function public.get_boss_beat_choice_versioned(p_beat_id text)
returns table(beat_id text, choice_index integer, choice_label text, reaction_ms integer, chosen_at timestamptz, content_version integer)
language sql security definer set search_path = public stable as $$
  select b.beat_id, b.choice_index, b.choice_label, b.reaction_ms, b.chosen_at, b.content_version
  from public.boss_beat_choices b where b.user_id = auth.uid() and b.beat_id = p_beat_id;
$$;

-- Old clients keep writing version 1. The unique key still makes the first
-- choice win across tabs, clients and content versions.
create or replace function public.record_boss_beat_choice(
  p_world_id text, p_lesson_id text, p_beat_id text,
  p_choice_index integer, p_choice_label text, p_reaction_ms integer default null
) returns boolean language sql security definer set search_path = public as $$
  select public.record_boss_beat_choice_versioned(p_world_id, p_lesson_id, p_beat_id, p_choice_index, p_choice_label, 1, p_reaction_ms);
$$;

-- An old renderer has only version-1 wording. Never feed it a version-2
-- choice to reinterpret. It can show its neutral scene; refresh loads the
-- version-aware client. A subsequent write cannot replace the original row.
create or replace function public.get_boss_beat_choice(p_beat_id text)
returns table(beat_id text, choice_index integer, choice_label text, reaction_ms integer, chosen_at timestamptz)
language sql security definer set search_path = public stable as $$
  select b.beat_id, b.choice_index, b.choice_label, b.reaction_ms, b.chosen_at
  from public.boss_beat_choices b where b.user_id = auth.uid() and b.beat_id = p_beat_id and b.content_version = 1;
$$;
revoke all on function public.record_boss_beat_choice_versioned(text,text,text,integer,text,integer,integer) from public;
grant execute on function public.record_boss_beat_choice_versioned(text,text,text,integer,text,integer,integer) to authenticated;
revoke all on function public.get_boss_beat_choice_versioned(text) from public;
grant execute on function public.get_boss_beat_choice_versioned(text) to authenticated;

insert into public.schema_migrations(version, name) values (63, 'version_story_choices') on conflict (version) do nothing;
commit;
