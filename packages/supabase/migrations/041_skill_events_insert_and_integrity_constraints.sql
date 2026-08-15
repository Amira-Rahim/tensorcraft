-- Tensorcraft: enable skill-event writes, and constrain client-writable tables.
--
-- Three related data-integrity fixes in one migration, deliberately: there is
-- no migration tracking in this project (see docs/audits/full-audit-2026-07-21.md
-- §3), so every additional file is another chance for the applied set to drift.
--
-- ============================================================
-- 1. skill_events: add the missing INSERT policy
-- ============================================================
-- Migration 013 recreated skill_events as a partitioned table but carried over
-- only the SELECT policy (013:65-68). `POST /api/skill-events/batch` writes via
-- getSupabaseServerClient(token), which passes the caller's JWT - so PostgREST
-- resolves the role from that JWT and the insert runs as `authenticated` with
-- RLS enforced. With no INSERT policy, every write is denied.
--
-- Nothing surfaced this because emitSkillEvent had zero call sites, so the
-- path was never exercised. Wiring the callers without this policy would have
-- produced silent failures on a fire-and-forget endpoint.
--
-- Compare exercise_attempts, which needed exactly this policy (004:25) for the
-- identical client factory and works correctly as a result.

create policy "Users can insert own skill events"
  on public.skill_events for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 2. theme_progress: constrain client-written identifiers
-- ============================================================
-- The web client writes theme_progress DIRECTLY to Supabase
-- (apps/web/lib/progress-client.ts), never through the validating API route,
-- and the insert policy checks only `auth.uid() = user_id` (001:88-93). So any
-- authenticated user could insert rows with arbitrary or megabyte-sized
-- identifiers. Downstream consequences, all real:
--
--   * prerequisite gates unlock on fabricated lesson_ids
--   * DISPATCH milestones compare `completed === expected` with strict
--     equality (dispatch.ts:79,99), so extra rows push a learner past the
--     count and the board-clear message never fires
--   * the certificate completion count inflates (certificates.ts:137)
--   * unbounded storage vector
--
-- Migration 016 already applies this shape to profiles.preferred_theme_id.
-- Lengths are generous relative to real slugs (longest shipped lesson slug is
-- ~40 chars) while still bounding abuse.
--
-- NOTE FOR THE OPERATOR: these are plain ADD CONSTRAINT, so they will FAIL
-- LOUDLY if any existing row violates them. That failure is information, not
-- an error to work around - it means junk data is already present. Inspect
-- before forcing:
--   select distinct theme_id from public.theme_progress;
--   select max(length(module_id)), max(length(lesson_id)) from public.theme_progress;

alter table public.theme_progress
  drop constraint if exists chk_theme_progress_theme_id;
alter table public.theme_progress
  add constraint chk_theme_progress_theme_id
  check (theme_id in (
    'deep-orbit','neon-protocol','signal-ward','nova-canvas','terra-grid'
  ));

alter table public.theme_progress
  drop constraint if exists chk_theme_progress_module_id_len;
alter table public.theme_progress
  add constraint chk_theme_progress_module_id_len
  check (length(module_id) between 1 and 80);

alter table public.theme_progress
  drop constraint if exists chk_theme_progress_lesson_id_len;
alter table public.theme_progress
  add constraint chk_theme_progress_lesson_id_len
  check (length(lesson_id) between 1 and 120);

-- ============================================================
-- 3. waitlist: bound what an anonymous insert can contain
-- ============================================================
-- 001:157-159 declares `with check (true)` on waitlist INSERT, reachable
-- unauthenticated over PostgREST because the frontend inserts directly
-- (lib/waitlist.ts:11-14). newsletter.ts then sends to every subscribed row.
-- So the live mailing list accepts arbitrary attacker-supplied addresses -
-- a spam, deliverability and CAN-SPAM exposure.
--
-- The signup itself must stay anonymous, so this cannot be closed with an
-- auth check. What it can do is bound the shape: a plausible email, sane
-- lengths, and a canonical theme_id. Volume control (rate limiting or a
-- captcha) belongs at the app layer and remains open - see the audit register.

alter table public.waitlist
  drop constraint if exists chk_waitlist_email_shape;
alter table public.waitlist
  add constraint chk_waitlist_email_shape
  check (
    length(email) between 3 and 254
    -- Deliberately permissive: this rejects obvious junk without trying to
    -- implement RFC 5322, which is a well-known trap.
    and position('@' in email) > 1
    and position('.' in split_part(email, '@', 2)) > 0
  );

alter table public.waitlist
  drop constraint if exists chk_waitlist_theme_id;
alter table public.waitlist
  add constraint chk_waitlist_theme_id
  check (
    theme_id is null
    or theme_id in (
      'deep-orbit','neon-protocol','signal-ward','nova-canvas','terra-grid'
    )
  );
