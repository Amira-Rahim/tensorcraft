-- Tensorcraft: persist the Stripe customer id on profiles.
--
-- Tier 1 of docs/audits/scalability-architecture-2026-07-21.md (finding F6).
-- Today only stripe_session_id is stored; there is no durable Stripe customer.
-- Both recurring billing (roadmap Horizon 1) and enterprise seat subscriptions
-- (Horizon 3) need one to manage a subscription and its seat quantity. Adding
-- the nullable column now is one line; retrofitting it after subscription rows
-- exist means backfilling every customer from the Stripe API.
--
-- Nullable and additive: existing one-time buyers simply have NULL here until
-- they next transact, at which point the webhook fills it in. Nothing reads it
-- yet, so this cannot break any current flow.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md.

begin;

alter table public.profiles
  add column if not exists stripe_customer_id text;

comment on column public.profiles.stripe_customer_id is
  'Stripe Customer id (cus_...), populated from the checkout webhook. Durable '
  'across purchases; required for recurring/seat subscriptions. Nullable: '
  'legacy one-time buyers have NULL until their next transaction.';

-- Lookups by customer id happen on subscription webhooks (customer.subscription.*
-- events carry the customer, not our user id). Partial index keeps it small -
-- only rows that actually have a customer are indexed.
create index if not exists idx_profiles_stripe_customer_id
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

insert into public.schema_migrations (version, name)
values (43, 'profiles_stripe_customer_id')
on conflict (version) do nothing;

commit;
