-- Revert 060: restore the enum-style source CHECK and the world-only id CHECK.
--
-- WARNING: rolling back re-breaks every waitlist capture surface except the
-- landing form, and will fail outright if rows written since 060 carry a
-- source or world_id the old constraints reject. Delete or rewrite those rows
-- first.

begin;

alter table public.waitlist
  drop constraint if exists chk_waitlist_source;
alter table public.waitlist
  add constraint chk_waitlist_source
  check (
    source is null
    or source in ('landing', 'pricing', 'blog', 'referral', 'social')
  );

alter table public.waitlist
  drop constraint if exists chk_waitlist_world_id;
alter table public.waitlist
  add constraint chk_waitlist_world_id
  check (
    world_id is null
    or world_id in (
      'deep-orbit','neon-protocol','signal-ward','nova-canvas','terra-grid'
    )
  );

delete from public.schema_migrations where version = 60;

commit;
