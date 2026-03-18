-- Tensorcraft: Secure Streaks Migration
-- Replaces direct INSERT/UPDATE RLS with a server-side function
-- that enforces streak logic, preventing arbitrary client manipulation.

-- 1. Drop the permissive INSERT/UPDATE policies
drop policy if exists "Users can insert own streaks" on public.streaks;
drop policy if exists "Users can update own streaks" on public.streaks;

-- 2. Create a secure function for streak updates (SECURITY DEFINER runs as owner, bypassing RLS)
create or replace function public.record_streak_activity(
  p_theme_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_existing record;
  v_new_streak integer;
  v_new_longest integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Try to find existing streak record
  select current_streak, longest_streak, last_activity_date
  into v_existing
  from public.streaks
  where user_id = v_user_id and theme_id = p_theme_id;

  if not found then
    -- First activity for this theme
    insert into public.streaks (user_id, theme_id, current_streak, longest_streak, last_activity_date)
    values (v_user_id, p_theme_id, 1, 1, v_today);
    return;
  end if;

  -- Already recorded activity today
  if v_existing.last_activity_date = v_today then
    return;
  end if;

  -- Calculate new streak
  if v_existing.last_activity_date = v_today - 1 then
    -- Consecutive day
    v_new_streak := coalesce(v_existing.current_streak, 0) + 1;
  else
    -- Streak broken
    v_new_streak := 1;
  end if;

  v_new_longest := greatest(coalesce(v_existing.longest_streak, 0), v_new_streak);

  update public.streaks
  set current_streak = v_new_streak,
      longest_streak = v_new_longest,
      last_activity_date = v_today
  where user_id = v_user_id and theme_id = p_theme_id;
end;
$$;
