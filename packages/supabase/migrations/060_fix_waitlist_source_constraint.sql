-- Tensorcraft: unbreak waitlist signups (2026-08-23).
--
-- Every waitlist form on the site has been failing its INSERT.
--
-- 009 added `chk_waitlist_source` as an enum-style CHECK allowing exactly
-- ('landing','pricing','blog','referral','social'). Every capture surface
-- built since passes something else:
--
--   world-selection    apps/web/app/worlds/newsletter-modal.tsx
--   free-module-end    .../[lesson]/guest-email-capture.tsx
--   coming-soon-hero   apps/web/app/worlds/[slug]/coming-soon-stub.tsx
--   coming-soon-footer apps/web/app/worlds/[slug]/coming-soon-stub.tsx
--
-- `submitWaitlist` never throws by design, so a rejected row returns "error"
-- and the visitor sees a generic failure. Nothing logs it and nothing alerts,
-- so the whole capture path has been dark. The coming-soon pages are the only
-- waitlist entry point for four of the five worlds, and the launch plan
-- depends on mailing that list.
--
-- The newsletter modal additionally passes world_id 'all', which 041's
-- theme_id CHECK (renamed to world_id by 058) also rejects.
--
-- Fix: bound the SHAPE rather than enumerate the values, the same call 041
-- deliberately made for email. An enum here means every new capture surface
-- needs a migration to work, which is precisely the trap that produced this
-- bug: the constraint and the code drifted with nothing to catch it.

-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped, idempotent, records its version, paired .down.sql.

begin;

-- Constraint names: 058 renamed identifiers containing "theme" generically,
-- so the 041 constraint is `chk_waitlist_world_id` on an applied database.
-- Both names are dropped so this migration is safe either way.
alter table public.waitlist
  drop constraint if exists chk_waitlist_source;
alter table public.waitlist
  add constraint chk_waitlist_source
  check (
    source is null
    or (
      length(source) between 1 and 64
      -- Lowercase kebab-case: enough to reject junk and injection-shaped
      -- input without needing a migration per new capture surface.
      and source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  );

alter table public.waitlist
  drop constraint if exists chk_waitlist_world_id;
alter table public.waitlist
  drop constraint if exists chk_waitlist_theme_id;
alter table public.waitlist
  add constraint chk_waitlist_world_id
  check (
    world_id is null
    or world_id in (
      'deep-orbit','neon-protocol','signal-ward','nova-canvas','terra-grid',
      -- 'all' means a site-wide signup that is not about one world. The
      -- newsletter modal has passed it since 2026-08-17.
      'all'
    )
  );

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (60, 'fix_waitlist_source_constraint')
on conflict (version) do nothing;

commit;
