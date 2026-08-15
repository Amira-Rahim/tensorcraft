-- Tensorcraft: make a WON dispute restorable (gap sweep F2, 2026-07-25).
--
-- 038's terminal-status trigger is correct for its purpose (webhook retries
-- must never regress refunded/disputed/failed back to completed), but it
-- also blocks the two LEGITIMATE restoration paths:
--   1. charge.dispute.closed with status "won" - the buyer's access should
--      come back, and no handler existed at all;
--   2. the operator's manual repair - `update purchases set
--      status='completed'` from the SQL editor "succeeds" (UPDATE 1) while
--      the trigger silently keeps the old status.
--
-- A blanket service-role exemption would be WRONG: the webhook itself runs
-- as service_role, so exempting it re-opens exactly the race 038 closed.
-- Instead: an explicit, transaction-local escape hatch. The trigger honors
-- `app.allow_terminal_override` (set via set_config(..., true) = local, so
-- it cannot leak past the transaction), and the only setter is a dedicated
-- RPC that names its intent. Race webhook writes never set it; restoration
-- must.
--
-- Operator repair (also fixes the F3 silent-no-op for this table):
--   select public.restore_purchase_after_dispute('pi_...');
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

-- ============================================================
-- 1. Teach the 038 trigger the escape hatch
-- ============================================================

create or replace function public.prevent_terminal_status_regression()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('refunded', 'partially_refunded', 'disputed', 'failed')
     and new.status not in ('refunded', 'partially_refunded', 'disputed', 'failed')
     -- Transaction-local override, settable only inside
     -- restore_purchase_after_dispute (or deliberately by an operator who
     -- read this file). Missing GUC reads as null -> coalesce false.
     and coalesce(current_setting('app.allow_terminal_override', true), '') <> 'on'
  then
    -- Keep the terminal status; let every other column of the update apply.
    new.status := old.status;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 2. The restoration RPC (service-role only)
-- ============================================================
-- SECURITY DEFINER so the SQL-editor operator path works too; EXECUTE is
-- revoked from every client role (the 019/039 lesson: Postgres grants
-- EXECUTE to PUBLIC by default, which would expose this at
-- /rest/v1/rpc/restore_purchase_after_dispute to anon).

create or replace function public.restore_purchase_after_dispute(
  p_payment_intent text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Local to this transaction only (third arg true).
  perform set_config('app.allow_terminal_override', 'on', true);

  update public.purchases
     set status = 'completed'
   where stripe_payment_intent = p_payment_intent
     and status = 'disputed';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.restore_purchase_after_dispute(text)
  from public, anon, authenticated;
grant execute on function public.restore_purchase_after_dispute(text)
  to service_role;

comment on function public.restore_purchase_after_dispute(text) is
  'Dispute won: restore access by moving disputed -> completed through the 038 trigger''s transaction-local escape hatch (migration 051). Service-role/operator only.';

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (51, 'dispute_won_restoration')
on conflict (version) do nothing;

commit;
