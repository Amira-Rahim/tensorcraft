-- Tensorcraft: extend the waitlist table for newsletter delivery.
--
-- Adds two columns to public.waitlist:
--   - subscribed       — opt-out flag, defaults to true. The newsletter sender
--                        (apps/api/src/lib/newsletter.ts) filters on this.
--   - unsubscribe_token — opaque token used in the one-click unsubscribe link.
--                        Generated server-side; never exposed in API responses
--                        beyond the URL embedded in the email itself.
--
-- Both columns are NOT NULL with sensible defaults so the existing rows stay
-- subscribed-by-default (they signed up; the original intent was newsletter
-- contact). Unsubscribing flips `subscribed` to false; we never delete rows
-- so re-subscribes can rejoin without changing tokens.

alter table public.waitlist
  add column if not exists subscribed boolean not null default true;

alter table public.waitlist
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Backfill is implicit via the column defaults — no UPDATE needed.

-- Looking up a row by token in the unsubscribe handler is the hot path.
create unique index if not exists uq_waitlist_unsubscribe_token
  on public.waitlist (unsubscribe_token);

-- Newsletter send queries filter by subscribed = true. Partial index keeps it
-- compact when most rows are subscribed (the expected steady state).
create index if not exists idx_waitlist_subscribed
  on public.waitlist (subscribed)
  where subscribed = true;
