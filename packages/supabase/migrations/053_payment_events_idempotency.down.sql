-- Down-migration for 053: drops the idempotency ledger. Concurrent
-- duplicate webhook deliveries regain the revenue-event/email TOCTOU.

begin;

drop table if exists public.payment_events;

delete from public.schema_migrations where version = 53;

commit;
