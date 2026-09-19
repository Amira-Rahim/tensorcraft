begin;

-- Production already has this field, confirmed by read-only introspection.
-- Bring fresh installations into agreement without rewriting migration 020
-- or removing any existing status, foreign key, policy or report.
alter table public.issues add column if not exists status text not null default 'open';
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'issues'
      and column_name = 'status' and data_type = 'text'
      and is_nullable = 'NO' and column_default = '''open''::text'
  ) then raise exception 'Unexpected issues.status contract; inspect before migration'; end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.issues'::regclass and conname = 'issues_status_check') then
    alter table public.issues add constraint issues_status_check
      check (status in ('open', 'in_progress', 'resolved', 'closed'));
  end if;
end $$;

insert into public.schema_migrations(version, name)
values (65, 'reconcile_issue_status') on conflict (version) do nothing;
commit;
