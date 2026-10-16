begin;

-- Keep earlier browser practice as history. Only the rebuilt sensor-layout
-- activity accepts version 2; every other activity remains version 1.
alter table public.learning_activity_streams
  drop constraint if exists learning_activity_streams_content_version_check;
alter table public.learning_activity_streams
  add constraint learning_activity_streams_content_version_check
  check (content_version = 1 or (activity_id = 'deep-orbit-channel-layout' and content_version = 2));
alter table public.learning_activity_progress
  drop constraint if exists learning_activity_progress_content_version_check;
alter table public.learning_activity_progress
  add constraint learning_activity_progress_content_version_check
  check (content_version = 1 or (activity_id = 'deep-orbit-channel-layout' and content_version = 2));

create or replace function public.record_learning_activity(
  p_expected_user_id uuid, p_activity_id text, p_content_version integer,
  p_phase text, p_stream_id uuid, p_attempt_count integer,
  p_first_correct boolean default null, p_first_assisted boolean default null,
  p_latest_correct boolean default null, p_latest_assisted boolean default null,
  p_assistance_observed boolean default false, p_completed_at timestamptz default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_old public.learning_activity_streams%rowtype;
  v_count integer;
  v_total integer;
  v_source text;
  v_first_time boolean;
begin
  if v_user is null or v_user is distinct from p_expected_user_id then raise exception 'Account changed; retry from the current account'; end if;
  if p_activity_id is null or p_activity_id not in ('deep-orbit-channel-layout','deep-orbit-normalization','deep-orbit-learning-rate','deep-orbit-threshold','deep-orbit-fft','deep-orbit-attention','deep-orbit-cache','room-project-run')
    or (p_content_version is distinct from 1 and (p_activity_id <> 'deep-orbit-channel-layout' or p_content_version is distinct from 2))
    then raise exception 'Unsupported activity or version'; end if;
  if p_phase is null or (p_activity_id = 'room-project-run' and p_phase <> 'application')
    or (p_activity_id <> 'room-project-run' and p_phase not in ('prediction','changed_case')) then raise exception 'Unsupported phase'; end if;
  if p_stream_id is null or p_attempt_count is null or p_attempt_count not between 0 and 20 or p_assistance_observed is null then raise exception 'Invalid activity record'; end if;
  if (p_attempt_count = 0 and (p_first_correct is not null or p_first_assisted is not null or p_latest_correct is not null or p_latest_assisted is not null))
    or (p_attempt_count > 0 and (p_first_correct is null or p_first_assisted is null or p_latest_correct is null or p_latest_assisted is null))
    or ((p_first_assisted or p_latest_assisted) and not p_assistance_observed)
    or (p_attempt_count = 1 and (p_first_correct is distinct from p_latest_correct or p_first_assisted is distinct from p_latest_assisted))
    then raise exception 'Outcome and assistance do not match count'; end if;
  if p_completed_at is not null and (p_attempt_count = 0 or p_completed_at > now() + interval '5 minutes' or p_completed_at < '2026-01-01'::timestamptz)
    then raise exception 'Invalid reported completion time'; end if;
  -- Serializes simultaneous devices for one summary. No cross-account lock key.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_activity_id || ':' || p_phase, 0));
  select * into v_old from public.learning_activity_streams where user_id=v_user and activity_id=p_activity_id and content_version=p_content_version and phase=p_phase and stream_id=p_stream_id;
  v_first_time := not found;
  if not v_first_time then
    if p_attempt_count < v_old.attempt_count then return; end if; -- delayed retry
    if v_old.attempt_count > 0 and (p_first_correct is distinct from v_old.first_correct or p_first_assisted is distinct from v_old.first_assisted)
      then raise exception 'First outcome is immutable'; end if;
    if p_attempt_count = v_old.attempt_count and (p_latest_correct is distinct from v_old.latest_correct or p_latest_assisted is distinct from v_old.latest_assisted)
      then raise exception 'A changed outcome needs another attempt'; end if;
    if p_attempt_count = v_old.attempt_count and (not p_assistance_observed or v_old.assistance_observed) then return; end if;
  else
    select count(*) into v_count from public.learning_activity_streams where user_id=v_user and activity_id=p_activity_id and content_version=p_content_version and phase=p_phase;
    if v_count >= 64 then raise exception 'Practice sync storage is full; existing records are preserved'; end if;
  end if;
  insert into public.learning_activity_streams(user_id,activity_id,content_version,phase,stream_id,attempt_count,first_correct,first_assisted,latest_correct,latest_assisted,assistance_observed,completed_at)
    values(v_user,p_activity_id,p_content_version,p_phase,p_stream_id,p_attempt_count,p_first_correct,p_first_assisted,p_latest_correct,p_latest_assisted,p_assistance_observed,p_completed_at)
    on conflict(user_id,activity_id,content_version,phase,stream_id) do update set
      attempt_count=excluded.attempt_count,
      first_correct=coalesce(learning_activity_streams.first_correct,excluded.first_correct),
      first_assisted=coalesce(learning_activity_streams.first_assisted,excluded.first_assisted),
      latest_correct=excluded.latest_correct, latest_assisted=excluded.latest_assisted,
      assistance_observed=learning_activity_streams.assistance_observed or excluded.assistance_observed,
      completed_at=coalesce(learning_activity_streams.completed_at,excluded.completed_at), updated_at=now();
  select sum(attempt_count) into v_total from public.learning_activity_streams where user_id=v_user and activity_id=p_activity_id and content_version=p_content_version and phase=p_phase;
  v_source := case when p_activity_id='room-project-run' then 'learner_report' else 'browser_check' end;
  insert into public.learning_activity_progress(user_id,activity_id,content_version,phase,first_correct,first_assisted,latest_correct,latest_assisted,attempt_count,assistance_observed,completed_at,source)
    values(v_user,p_activity_id,p_content_version,p_phase,p_first_correct,p_first_assisted,p_latest_correct,p_latest_assisted,v_total,p_assistance_observed,p_completed_at,v_source)
    on conflict(user_id,activity_id,content_version,phase) do update set
      first_correct=coalesce(learning_activity_progress.first_correct,excluded.first_correct),
      first_assisted=coalesce(learning_activity_progress.first_assisted,excluded.first_assisted),
      latest_correct=case when p_attempt_count > coalesce(v_old.attempt_count,0) then excluded.latest_correct else learning_activity_progress.latest_correct end,
      latest_assisted=case when p_attempt_count > coalesce(v_old.attempt_count,0) then excluded.latest_assisted else learning_activity_progress.latest_assisted end,
      attempt_count=v_total,
      assistance_observed=learning_activity_progress.assistance_observed or excluded.assistance_observed,
      completed_at=coalesce(learning_activity_progress.completed_at,excluded.completed_at), updated_at=now();
end $$;
revoke all on function public.record_learning_activity(uuid,text,integer,text,uuid,integer,boolean,boolean,boolean,boolean,boolean,timestamptz) from public;
grant execute on function public.record_learning_activity(uuid,text,integer,text,uuid,integer,boolean,boolean,boolean,boolean,boolean,timestamptz) to authenticated;
insert into public.schema_migrations(version,name)
values(66,'channel_layout_v2') on conflict(version) do nothing;
commit;
