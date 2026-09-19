begin;

alter table public.profiles add column if not exists ml_learning_route text;
alter table public.profiles drop constraint if exists profiles_ml_learning_route_check;
alter table public.profiles add constraint profiles_ml_learning_route_check
  check (ml_learning_route is null or ml_learning_route in ('guided', 'challenge'));
comment on column public.profiles.ml_learning_route is
  'Optional ML study route. Separate from JS experience; grants no access, completion, or certificate credit.';

insert into public.schema_migrations (version, name)
values (62, 'ml_learning_route') on conflict (version) do nothing;
commit;
