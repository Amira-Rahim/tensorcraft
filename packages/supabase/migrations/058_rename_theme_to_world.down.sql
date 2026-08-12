-- Down-migration for 058: rename "world" identifiers back to "theme".
--
-- Exact mirror of the up file's generic loops with the replacement reversed.
-- Safe because no pre-058 database identifier contained "world" (verified
-- against migrations 001-057 on 2026-08-12), so '%world%' matches only what
-- 058 renamed. One cosmetic caveat: if a function body's COMMENTS contained
-- the word "world" before 058 ran, this reversal rewrites those too.

begin;

do $$
declare r record;
begin
  for r in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like '%world%'
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
      replace(r.relname, 'world', 'theme')
    );
  end loop;
end $$;

do $$
declare r record;
begin
  for r in
    select c.relname, c.relkind, a.attname
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and a.attname like '%world%'
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
      replace(r.attname, 'world', 'theme')
    );
  end loop;
end $$;

do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like '%world%'
      and c.relkind in ('i', 'I')
  loop
    execute format(
      'alter index public.%I rename to %I',
      r.relname,
      replace(r.relname, 'world', 'theme')
    );
  end loop;
end $$;

do $$
declare r record;
begin
  for r in
    select cl.relname, con.conname
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    where n.nspname = 'public'
      and con.conname like '%world%'
      and con.conislocal
  loop
    execute format(
      'alter table public.%I rename constraint %I to %I',
      r.relname,
      r.conname,
      replace(r.conname, 'world', 'theme')
    );
  end loop;
end $$;

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
      and t.tgname like '%world%'
  loop
    execute format(
      'alter trigger %I on public.%I rename to %I',
      r.tgname,
      r.relname,
      replace(r.tgname, 'world', 'theme')
    );
  end loop;
end $$;

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
      and (p.prosrc ilike '%world%'
           or pg_get_function_arguments(p.oid) ilike '%world%'
           or pg_get_function_result(p.oid) ilike '%world%')
  loop
    newdef := replace(replace(replace(pg_get_functiondef(r.oid),
                'WORLD', 'THEME'), 'World', 'Theme'), 'world', 'theme');
    sig := format('public.%I(%s)', r.proname, r.identity_args);

    if r.args ilike '%world%' or r.result ilike '%world%' then
      execute format('drop function %s', sig);
      execute newdef;
      if r.proacl is not null then
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
      execute newdef;
    end if;
  end loop;
end $$;

update public.news_items
set matched_lessons =
      replace(matched_lessons::text, '"worldId"', '"themeId"')::jsonb
where matched_lessons::text like '%"worldId"%';

delete from public.schema_migrations where version = 58;

commit;
