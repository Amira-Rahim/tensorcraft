-- Down-migration for 050: restore the pre-consent-fix default.
--
-- NOTE: rolling back re-opens the R2-4 consent-escalation exposure - every
-- new waitlist signup silently re-enrolls into the newsletter.

begin;

alter table public.waitlist alter column subscribed set default true;

delete from public.schema_migrations where version = 50;

commit;
