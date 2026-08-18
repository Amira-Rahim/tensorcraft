-- Tensorcraft: rename the FE-era identifiers to JS (2026-08-18 rebrand).
--
-- The audience positioning moved from "frontend engineers" to "JavaScript
-- engineers" (owner decision 2026-08-18). This renames the identifiers that
-- carried the old audience into the schema:
--   * profiles.fe_background        -> js_background
--   * profiles.fe_experience_years  -> js_experience_years
--   * profiles.fe_framework         -> DROPPED. Write-only since 034 pinned
--     it to the constant 'react'; no select anywhere reads it back. The V1
--     React-only scope lives in course content, not the profile.
--   * skill_axis value 'fe_integration' -> 'js_integration' in the CHECK
--     constraints and stored rows of skill_events (partitioned parent;
--     children inherit the constraint) and skill_genome.
--
-- Apply BEFORE deploying the app code that reads/writes the js_* names
-- (same ordering rule as 047/058). The API ships a one-release shim that
-- accepts the old wire keys and axis value, so old-web + new-DB + new-API
-- stays compatible during the deploy window.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

-- ============================================================
-- profiles: column renames + fe_framework drop
-- ============================================================
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'fe_background') then
    alter table public.profiles rename column fe_background to js_background;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'fe_experience_years') then
    alter table public.profiles
      rename column fe_experience_years to js_experience_years;
  end if;
end $$;

-- The inline years CHECK keeps working after the rename (check expressions
-- are stored parsed), but its auto-generated name still says fe. Rename it
-- so the catalog matches the column.
do $$
begin
  if exists (select 1 from pg_constraint
             where conrelid = 'public.profiles'::regclass
               and conname = 'profiles_fe_experience_years_check') then
    alter table public.profiles
      rename constraint profiles_fe_experience_years_check
      to profiles_js_experience_years_check;
  end if;
end $$;

alter table public.profiles drop constraint if exists chk_profiles_fe_framework;
alter table public.profiles drop column if exists fe_framework;

-- ============================================================
-- skill_axis value: fe_integration -> js_integration
-- ============================================================
-- Drop every CHECK still pinning the old value. The names are
-- auto-generated and differ per table history (skill_events was created as
-- skill_events_new in 013 and the constraint name survived the table
-- rename), so discover them from the catalog rather than hardcoding.
-- Dropping on the partitioned parent cascades to the children.
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
      and pg_get_constraintdef(oid) like '%fe_integration%'
  loop
    execute format('alter table %s drop constraint %I', con.rel, con.conname);
  end loop;
end $$;

-- Parent-level UPDATE reaches every partition; 041 added only CHECKs and
-- policies, so no trigger blocks this.
update public.skill_events
set skill_axis = 'js_integration'
where skill_axis = 'fe_integration';

update public.skill_genome
set skill_axis = 'js_integration'
where skill_axis = 'fe_integration';

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.skill_events'::regclass
                   and conname = 'chk_skill_events_skill_axis') then
    alter table public.skill_events
      add constraint chk_skill_events_skill_axis check (skill_axis in (
        'data_prep', 'model_arch', 'training', 'evaluation', 'deployment',
        'js_integration'
      ));
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.skill_genome'::regclass
                   and conname = 'chk_skill_genome_skill_axis') then
    alter table public.skill_genome
      add constraint chk_skill_genome_skill_axis check (skill_axis in (
        'data_prep', 'model_arch', 'training', 'evaluation', 'deployment',
        'js_integration'
      ));
  end if;
end $$;

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (59, 'rename_fe_identifiers_to_js')
on conflict (version) do nothing;

commit;
