begin;

-- Account consent is read by server event capture. Only the current account
-- can read its row. The RPC serializes choices and prevents a stale grant
-- from replacing a later withdrawal. No existing account opts in by default.
create table if not exists public.analytics_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted boolean not null default false,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

alter table public.analytics_consents enable row level security;
drop policy if exists analytics_consents_read_own on public.analytics_consents;
create policy analytics_consents_read_own on public.analytics_consents
  for select to authenticated using (user_id = auth.uid());
revoke all on public.analytics_consents from public, anon, authenticated;
grant select on public.analytics_consents to authenticated, service_role;

create or replace function public.set_analytics_consent(
  p_granted boolean,
  p_expected_revision integer
) returns table (
  granted boolean,
  revision integer,
  updated_at timestamptz,
  applied boolean
) language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_current public.analytics_consents%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_granted is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid analytics consent choice';
  end if;

  -- A row lock alone cannot serialize two first choices when no row exists.
  -- This transaction lock covers that case without inserting a record for a
  -- stale grant. Existing rows also remain locked until the choice commits.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('analytics-consent:' || v_user::text, 0)
  );
  select c.* into v_current from public.analytics_consents as c
    where c.user_id = v_user for update;

  if not found then
    if p_granted and p_expected_revision <> 0 then
      return query select false, 0, null::timestamptz, false;
      return;
    end if;
    insert into public.analytics_consents(user_id, granted, revision, updated_at)
      values (v_user, p_granted, 1, pg_catalog.clock_timestamp())
      returning * into v_current;
  else
    if p_granted and v_current.revision <> p_expected_revision then
      return query select v_current.granted, v_current.revision,
        v_current.updated_at, false;
      return;
    end if;
    -- Withdrawals advance the revision even when their expected value is old.
    -- Any grant prepared before this withdrawal will then fail its comparison.
    update public.analytics_consents as c
      set granted = p_granted,
          revision = c.revision + 1,
          updated_at = pg_catalog.clock_timestamp()
      where c.user_id = v_user returning c.* into v_current;
  end if;

  return query select v_current.granted, v_current.revision,
    v_current.updated_at, true;
end $$;

revoke all on function public.set_analytics_consent(boolean, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.set_analytics_consent(boolean, integer)
  to authenticated;

insert into public.schema_migrations(version, name)
values (67, 'analytics_consent') on conflict (version) do nothing;
commit;
