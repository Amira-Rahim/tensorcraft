-- Tensorcraft: Lore artifact drops (Slice #19)
--
-- World-canon collectibles. Random drop chance on lesson completion
-- (~20%, capped at 1/day per user). Drops reference a static catalog
-- of artifact_id values defined in `apps/web/lib/lore-catalog.ts`. The
-- DB stores only the join (which user got which artifact, when) so the
-- catalog can grow without DB migrations.

create table public.lore_drops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artifact_id text not null,
  dropped_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, artifact_id)
);

create index idx_lore_drops_user_recent
  on public.lore_drops (user_id, dropped_at desc);

alter table public.lore_drops enable row level security;

create policy "Users view own lore drops"
  on public.lore_drops for select
  using (auth.uid() = user_id);

-- Drop attempt: ~20% chance unless caller has already received a drop
-- today. RPC returns the dropped artifact_id, or NULL if no drop fired.
-- Caller passes a candidate artifact_id (chosen client-side so the catalog
-- stays out of the DB).
create or replace function public.try_drop_lore_artifact(p_artifact_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today_count int;
begin
  if v_user_id is null then
    return null;
  end if;

  -- Daily cap: at most one drop in the last 24h.
  select count(*) into v_today_count
  from public.lore_drops
  where user_id = v_user_id
    and dropped_at > now() - interval '1 day';

  if v_today_count >= 1 then
    return null;
  end if;

  -- 20% drop chance.
  if random() >= 0.20 then
    return null;
  end if;

  insert into public.lore_drops (user_id, artifact_id)
  values (v_user_id, p_artifact_id)
  on conflict (user_id, artifact_id) do nothing;

  return p_artifact_id;
end;
$$;

-- Mark a dropped artifact as read.
create or replace function public.mark_lore_read(p_artifact_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  update public.lore_drops
  set read_at = coalesce(read_at, now())
  where user_id = v_user_id and artifact_id = p_artifact_id;
end;
$$;
