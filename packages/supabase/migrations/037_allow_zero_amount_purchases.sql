-- Tensorcraft migration 037: allow $0 purchase rows (credit auto-grants)
--
-- Context (audit run #7, 2026-07-16): the upgrade path inserts a purchase
-- row with amount = 0 when accumulated credit fully covers a plan
-- (payments.ts auto-grant). Migration 002's chk_amount_positive requires
-- amount > 0, so every fully-credited upgrade 500'd. The row is legitimate:
-- it records an entitlement whose price was paid across earlier purchases.
--
-- amount stays non-negative; nothing else about the constraint changes.

alter table public.purchases
  drop constraint if exists chk_amount_positive;

alter table public.purchases
  add constraint chk_amount_positive check (amount >= 0);

comment on constraint chk_amount_positive on public.purchases is
  'Amounts are non-negative; 0 is reserved for credit-funded auto-grants (see payments.ts checkout).';
