-- Down-migration for 051: restore the 038 trigger function verbatim and
-- drop the restoration RPC.
--
-- NOTE: rolling back removes the ONLY path that can restore access after a
-- won dispute - disputed rows become terminally stuck again (gap sweep F2).

begin;

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

drop function if exists public.restore_purchase_after_dispute(text);

delete from public.schema_migrations where version = 51;

commit;
