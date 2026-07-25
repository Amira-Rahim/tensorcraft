-- Down-migration for 056: restore the 001 cascade semantics.
--
-- WARNING: cannot restore NOT NULL if anonymized (user_id IS NULL) rows
-- exist — those are retained tax records; do not delete them to force this
-- down. The down fails loudly in that case, by design.

begin;

alter table public.purchases
  drop constraint if exists purchases_user_id_fkey;

alter table public.purchases
  add constraint purchases_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.purchases
  alter column user_id set not null;

delete from public.schema_migrations where version = 56;

commit;
