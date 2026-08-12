-- Tensorcraft: rename the product concept "theme" to "world" (2026-08-12).
--
-- The five purchasable story courses (deep-orbit, neon-protocol, signal-ward,
-- nova-canvas, terra-grid) are "worlds" across the product from 2026-08-12.
-- This renames every database identifier carrying the old term: tables,
-- views, materialized-view columns, sequences, indexes (including the
-- per-partition indexes of skill_events), constraints, triggers, function
-- parameter names and bodies, plus the themeId keys inside
-- news_items.matched_lessons jsonb. Slug VALUES ('deep-orbit', ...) are
-- unchanged; only identifiers move. Apply BEFORE deploying the app code that
-- queries world_* names (same ordering rule as 047).
--
-- Mechanics this relies on:
--   * Policies, view/matview definitions, column defaults and check
--     expressions are stored parsed, so they track renames automatically;
--     only function BODIES (stored as text) need rewriting. Bodies are taken
--     from the LIVE definitions via pg_get_functiondef(), not re-authored.
--   * CREATE OR REPLACE cannot rename parameters or result columns, so
--     functions whose signature carries "theme" are DROPped and recreated;
--     their ACLs (the 036/039 EXECUTE lockdown) are captured with
--     aclexplode() first and re-applied. Body-only functions go through
--     CREATE OR REPLACE, which preserves ACLs and dependencies.
--   * Partition children follow their parent's column/constraint rename, so
--     the column loop skips inherited relations and the constraint loop
--     takes only conislocal rows.
--
-- Follows CONVENTIONS.md: transaction wrapped · idempotent (every loop
-- matches '%theme%', which matches nothing after the first run) · records
-- its version · paired .down.sql.

begin;

-- ---- 1. tables, views, materialized views, sequences --------------------

do $$
declare r record;
begin
  for r in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like '%theme%'
      and c.relkind in ('r', 'p', 'v', 'm', 'S')
  loop
    execute format(
      'alter %s public.%I rename to %I',
      case r.relkind
        when 'v' then 'view'
        when 'm' then 'materialized view'
        when 'S' then 'sequence'
        else 'table'
      end,
      r.relname,
      replace(r.relname, 'theme', 'world')
    );
  end loop;
end $$;

-- ---- 2. columns (partition children inherit the parent's rename) --------

do $$
declare r record;
begin
  for r in
    select c.relname, c.relkind, a.attname
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and a.attname like '%theme%'
      and a.attnum > 0
      and not a.attisdropped
      and c.relkind in ('r', 'p', 'v', 'm')
      and not exists (select 1 from pg_inherits i where i.inhrelid = c.oid)
  loop
    execute format(
      'alter %s public.%I rename column %I to %I',
      case r.relkind
        when 'v' then 'view'
        when 'm' then 'materialized view'
        else 'table'
      end,
      r.relname,
      r.attname,
      replace(r.attname, 'theme', 'world')
    );
  end loop;
end $$;

-- ---- 3. indexes (each partition index is its own pg_class row) ----------

do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like '%theme%'
      and c.relkind in ('i', 'I')
  loop
    execute format(
      'alter index public.%I rename to %I',
      r.relname,
      replace(r.relname, 'theme', 'world')
    );
  end loop;
end $$;

-- ---- 4. constraints (local only; partitioned parents recurse) -----------

do $$
declare r record;
begin
  for r in
    select cl.relname, con.conname
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    where n.nspname = 'public'
      and con.conname like '%theme%'
      and con.conislocal
  loop
    execute format(
      'alter table public.%I rename constraint %I to %I',
      r.relname,
      r.conname,
      replace(r.conname, 'theme', 'world')
    );
  end loop;
end $$;

-- ---- 5. triggers --------------------------------------------------------

do $$
declare r record;
begin
  for r in
    select t.tgname, c.relname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and not t.tgisinternal
      and t.tgname like '%theme%'
  loop
    execute format(
      'alter trigger %I on public.%I rename to %I',
      r.tgname,
      r.relname,
      replace(r.tgname, 'theme', 'world')
    );
  end loop;
end $$;

-- ---- 6. functions -------------------------------------------------------
-- Rewrites the LIVE definitions. Signature-carrying functions (as of this
-- writing: record_streak_activity, compute_user_skill_genome,
-- get_shared_certificate, record_boss_beat_choice, record_counterfactual,
-- get_counterfactual) take the drop + recreate + ACL-restore path; body-only
-- ones (refresh_dashboard_stats and any future match) take CREATE OR REPLACE.

do $$
declare
  r record;
  acl record;
  sig text;
  newdef text;
begin
  for r in
    select p.oid, p.proname, p.proacl,
           pg_get_function_identity_arguments(p.oid) as identity_args,
           pg_get_function_arguments(p.oid) as args,
           pg_get_function_result(p.oid) as result
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (select 1 from pg_depend d
                      where d.objid = p.oid and d.deptype = 'e')
      and (p.prosrc ilike '%theme%'
           or pg_get_function_arguments(p.oid) ilike '%theme%'
           or pg_get_function_result(p.oid) ilike '%theme%')
  loop
    newdef := replace(replace(replace(pg_get_functiondef(r.oid),
                'THEME', 'WORLD'), 'Theme', 'World'), 'theme', 'world');
    sig := format('public.%I(%s)', r.proname, r.identity_args);

    if r.args ilike '%theme%' or r.result ilike '%theme%' then
      execute format('drop function %s', sig);
      execute newdef;
      if r.proacl is not null then
        -- restore the exact pre-drop grant state (036/039 lockdown)
        execute format('revoke all on function %s from public', sig);
        for acl in select grantee, privilege_type from aclexplode(r.proacl)
        loop
          execute format(
            'grant %s on function %s to %s',
            acl.privilege_type,
            sig,
            case when acl.grantee = 0 then 'public'
                 else acl.grantee::regrole::text end
          );
        end loop;
      end if;
    else
      execute newdef;  -- CREATE OR REPLACE: ACLs and dependencies survive
    end if;
  end loop;
end $$;

-- ---- 7. jsonb data keys: news_items.matched_lessons[].themeId -----------

update public.news_items
set matched_lessons =
      replace(matched_lessons::text, '"themeId"', '"worldId"')::jsonb
where matched_lessons::text like '%"themeId"%';

-- ---- record this migration (keep last, before commit) ----

insert into public.schema_migrations (version, name)
values (58, 'rename_theme_to_world')
on conflict (version) do nothing;

commit;
