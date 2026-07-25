-- Tensorcraft: webhook idempotency ledger (fresh-eyes rerun §7 irreversible
-- list #6; run-2 diff review's accepted-risk TOCTOU).
--
-- Stripe delivers at-least-once. The handlers guard the worst outcomes with
-- pre-checks and DB constraints, but two CONCURRENT deliveries of the same
-- event can still both pass the read-side guards (the accepted TOCTOU on
-- the revenue event + confirmation email). A unique event-id ledger closes
-- the class: the first INSERT wins, the loser sees the conflict and ACKs
-- without re-processing.
--
-- Service-role only (the webhook), like schema_migrations: RLS on with zero
-- policies + explicit revoke.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

create table if not exists public.payment_events (
  stripe_event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from public, anon, authenticated;
grant select, insert on public.payment_events to service_role;

comment on table public.payment_events is
  'Webhook idempotency ledger: first insert of a stripe_event_id wins; concurrent duplicate deliveries ACK without re-processing (migration 053).';

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (53, 'payment_events_idempotency')
on conflict (version) do nothing;

commit;
