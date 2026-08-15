-- Tensorcraft: DISPATCH inbox messages (Slice #13)
--
-- Server-curated narrator messages. DISPATCH is the cross-theme meta-narrator
-- introduced in Slice #11 (operator log). Inbox surfaces:
--   - weekly_intel - automated weekly summary w/ CTA into /log or /review
--   - milestone - fired on theme completion / capstone pass / streak ≥ 7d
--   - cliffhanger - fired by Slice #1 when player completes a theme finale
--
-- Writes: server-only via SECURITY DEFINER RPCs OR scheduled functions.
-- Reads: each user reads only their own inbox.

create table public.dispatch_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('weekly_intel', 'milestone', 'cliffhanger')),
  subject text not null,
  body_mdx text not null,
  cta_label text,
  cta_href text,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create index idx_dispatch_messages_user_unread
  on public.dispatch_messages (user_id, sent_at desc)
  where read_at is null;

create index idx_dispatch_messages_user_recent
  on public.dispatch_messages (user_id, sent_at desc);

alter table public.dispatch_messages enable row level security;

create policy "Users can view own dispatch messages"
  on public.dispatch_messages for select
  using (auth.uid() = user_id);

-- Mark as read - only the recipient can mark their own messages.
create or replace function public.mark_dispatch_read(p_message_id uuid)
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

  update public.dispatch_messages
  set read_at = coalesce(read_at, now())
  where id = p_message_id and user_id = v_user_id;
end;
$$;

-- Server-side helper that fires a milestone message. Called from triggers
-- or scheduled functions; not exposed to clients (no auth.uid() check -
-- callers must already be SECURITY DEFINER context OR service role).
create or replace function public.dispatch_milestone(
  p_user_id uuid,
  p_subject text,
  p_body_mdx text,
  p_cta_label text default null,
  p_cta_href text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.dispatch_messages (user_id, kind, subject, body_mdx, cta_label, cta_href)
  values (p_user_id, 'milestone', p_subject, p_body_mdx, p_cta_label, p_cta_href)
  returning id into v_id;
  return v_id;
end;
$$;

-- Counts unread messages for the calling user. Used by the nav-bar badge.
create or replace function public.count_unread_dispatch()
returns int
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid := auth.uid();
  v_count int;
begin
  if v_user_id is null then
    return 0;
  end if;
  select count(*)::int into v_count
  from public.dispatch_messages
  where user_id = v_user_id and read_at is null;
  return coalesce(v_count, 0);
end;
$$;
