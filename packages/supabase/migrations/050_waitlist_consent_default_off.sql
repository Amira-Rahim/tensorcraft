-- Tensorcraft: waitlist signups no longer default into the newsletter (R2-4).
--
-- 025_waitlist_subscribed.sql set `subscribed boolean not null default true`,
-- and the digest sender mails every `subscribed = true` row. Net effect:
-- someone who asked to be told when ONE theme ships was auto-enrolled into a
-- weekly newsletter carrying discounts - consent neither specific nor freely
-- given (GDPR Art. 4(11), PECR reg. 22; Tier 1-LEGAL "waitlist consent fix").
--
-- After this migration, `subscribed = true` means the visitor explicitly
-- chose the newsletter (the newsletter modal passes it; theme waitlist forms
-- do not), so the sender's `.eq("subscribed", true)` selects exactly the
-- consented set.
--
-- EXISTING rows are deliberately NOT flipped here: whether to keep mailing
-- the pre-2026-07-25 cohort (auto-enrolled under the old default) is an
-- owner/advisor decision, not a schema default. The one-line remediation if
-- chosen:  update public.waitlist set subscribed = false
--          where source not in ('theme-selection');
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

alter table public.waitlist alter column subscribed set default false;

-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (50, 'waitlist_consent_default_off')
on conflict (version) do nothing;

commit;
