-- Tensorcraft migration 038: purchases terminal-status regression guard
--
-- Context (audit run #7, 2026-07-16): the webhook's SELECT-then-UPSERT is
-- not atomic. A charge.refunded landing between a retried
-- checkout.session.completed's pre-check and its upsert could be
-- overwritten back to "completed", silently restoring access after a
-- refund. The application-level guard narrows the window to milliseconds;
-- this trigger closes it: once a purchase reaches a terminal status
-- (refunded / partially_refunded / disputed / failed), no UPDATE may move
-- it back to a non-terminal one, regardless of webhook ordering or retries.
--
-- Terminal-to-terminal transitions stay allowed (partially_refunded ->
-- refunded when a second refund completes the amount; anything -> disputed).

create or replace function public.prevent_terminal_status_regression()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('refunded', 'partially_refunded', 'disputed', 'failed')
     and new.status not in ('refunded', 'partially_refunded', 'disputed', 'failed')
  then
    -- Keep the terminal status; let every other column of the update apply.
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_purchases_no_status_regression on public.purchases;

create trigger trg_purchases_no_status_regression
  before update on public.purchases
  for each row
  execute function public.prevent_terminal_status_regression();

comment on function public.prevent_terminal_status_regression() is
  'Webhook retries race refunds; a terminal purchase status must never regress to a non-terminal one (migration 038, audit run #7).';
