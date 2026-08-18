-- Down for 059_rename_fe_identifiers_to_js: restore the FE-era identifiers.
--
-- fe_framework is restored structurally and backfilled with 'react' where
-- onboarding completed. That is a best-effort restore of information
-- content, not row-for-row nullness: the column only ever held the constant
-- 'react' (written on every completed onboarding since 034), so the
-- approximation loses nothing meaningful.
--
-- Roll the API image back together with this file; the renamed columns
-- disappear out from under the js_*-aware code otherwise.

begin;

-- ============================================================
-- skill_axis value: js_integration -> fe_integration
-- ============================================================
do $$
declare
  con record;
begin
  for con in
    select conrelid::regclass as rel, conname
    from pg_constraint
    where conrelid in ('public.skill_events'::regclass,
                       'public.skill_genome'::regclass)
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%js_integration%'
  loop
    execute format('alter table %s drop constraint %I', con.rel, con.conname);
  end loop;
end $$;

update public.skill_events
set skill_axis = 'fe_integration'
where skill_axis = 'js_integration';

update public.skill_genome
set skill_axis = 'fe_integration'
where skill_axis = 'js_integration';

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.skill_events'::regclass
                   and conname = 'chk_skill_events_skill_axis') then
    alter table public.skill_events
      add constraint chk_skill_events_skill_axis check (skill_axis in (
        'data_prep', 'model_arch', 'training', 'evaluation', 'deployment',
        'fe_integration'
      ));
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.skill_genome'::regclass
                   and conname = 'chk_skill_genome_skill_axis') then
    alter table public.skill_genome
      add constraint chk_skill_genome_skill_axis check (skill_axis in (
        'data_prep', 'model_arch', 'training', 'evaluation', 'deployment',
        'fe_integration'
      ));
  end if;
end $$;

-- ============================================================
-- profiles: rename back + restore fe_framework
-- ============================================================
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'js_background') then
    alter table public.profiles rename column js_background to fe_background;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'js_experience_years') then
    alter table public.profiles
      rename column js_experience_years to fe_experience_years;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_constraint
             where conrelid = 'public.profiles'::regclass
               and conname = 'profiles_js_experience_years_check') then
    alter table public.profiles
      rename constraint profiles_js_experience_years_check
      to profiles_fe_experience_years_check;
  end if;
end $$;

alter table public.profiles add column if not exists fe_framework text;

alter table public.profiles drop constraint if exists chk_profiles_fe_framework;
alter table public.profiles
  add constraint chk_profiles_fe_framework
  check (fe_framework is null or fe_framework = 'react');

update public.profiles
set fe_framework = 'react'
where onboarding_completed = true
  and fe_framework is null;

delete from public.schema_migrations where version = 59;

commit;
