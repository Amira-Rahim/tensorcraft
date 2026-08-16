# Privacy policy audit + remediation (2026-08-16)

Trigger: owner asked whether <https://www.tensorcraft.app/privacy> is
accurate and whether it creates legal exposure. Method: full codebase
inventory of actual data practices (cookies, storage keys, analytics,
database tables, processors, email flows, rights plumbing), diffed
against the policy text dated 2026-04-21. Not legal advice; a lawyer
should review the final policy text before scale-up.

## Findings (policy vs. reality, before fixes)

1. Policy credited Kit with "transactional and lifecycle email
   delivery"; the digest and support notifications are sent by Resend,
   which the policy never named.
2. Missing processors: Resend, Upstash Redis (raw client IPs as
   rate-limit keys, TTL 120s), jsDelivr (runtime TFJS fallback CDN),
   and Vercel Web Analytics as an analytics processor.
3. Cookie section omitted `tc_world` (1-year personalization cookie set
   by middleware before any consent interaction), the GitHub OAuth
   state cookie, and ~14 localStorage keys including learner exercise
   code (`tc-code-*`).
4. `posthog.identify()` sent the account email as a person property,
   contradicting both the policy's "privacy-focused analytics" framing
   and the taxonomy's own "No PII" rule (`analytics-events.ts`).
5. Sentry browser SDK ran Session Replay at 100% on error, outside the
   consent gate and undisclosed. (The `beforeSend` PII scrub the policy
   claimed does exist, on both web and API configs.)
6. The 30-day deletion promise had undisclosed exceptions: purchases
   retained ~10 years for VAT/OSS (migration 056, correct behavior, not
   disclosed), `issues` rows (email, UA, page URL, screenshot) never
   deleted or exported, and no purge of PostHog/Sentry/Upstash/Resend.
7. Missing mandatory GDPR Art. 13 content: controller identity, legal
   bases per purpose, international-transfer disclosure, right to
   complain to a supervisory authority.
8. "Not intended for under-16s" had no backing eligibility clause in
   the Terms.
9. Emails reached plaintext Fly logs via `newsletter.ts`,
   `guest-account.ts`, and the Kit bounce webhook; the Pino redact list
   covered tokens but not `email`.

What was already solid: real export endpoint (12 tables), real deletion
flow with typed confirmation, consent banner with a working fail-closed
reject path, RFC 8058 one-click unsubscribe, Stripe holding card data.

## Fixes shipped this session

Code (behavior first, so the policy text is true):

- `apps/web/sentry.client.config.ts`: `replaysOnErrorSampleRate` 1.0 to
  0; docstring records why Replay stays off.
- `apps/web/lib/supabase/session-listener.tsx`: `identify()` no longer
  sends the email; UUID + `created_at` only.
- `apps/api/src/lib/logger.ts`: `email` and `*.email` added to the Pino
  redact list.
- `apps/api/src/lib/newsletter.ts`: send-failure captures log the
  unsubscribe token, not the address.
- `apps/api/src/lib/guest-account.ts`: lookup/create failures no longer
  log the address.
- `apps/api/src/routes/webhooks.ts`: bounce log carries Kit's
  `subscriberId` instead of the address; Kit dashboard is the system of
  record for bounces.
- `apps/api/src/routes/profiles.ts`: export now includes
  `arena_submissions` (learner code) and `issues` rows (matched on
  user_id AND email, deduped, fail-loud); deletion anonymizes `issues`
  (nulls user_id/email/screenshot_url) and best-effort deletes the
  screenshot objects from storage before `deleteUser`.

Tests: `profiles-privacy.test.ts` extended (issues in export, dedupe,
anonymization + screenshot removal on delete, arena_submissions
present); `webhooks.test.ts` asserts the raw address never reaches the
log; privacy + terms snapshots re-minted; em-dash and slop-lexicon
gates green.

Prose:

- `apps/web/app/privacy/page.tsx`: full rewrite, dated 2026-08-16.
  Twelve sections: controller identity (PLACEHOLDER, see below), honest
  collection inventory (onboarding answers, submitted code, tax
  capture, bug reports, guest checkout account creation, certificate
  share pages, IP rate limiting), purposes with GDPR legal bases,
  consent-gated analytics + ungated Sentry with replay-off statement,
  corrected processor list (Resend, Upstash, jsDelivr, Vercel Analytics
  added; Kit demoted to lifecycle), cookies + localStorage, transfers
  with DPF/SCC language, rights incl. supervisory-authority complaint
  and the Settings export/delete controls, retention with the three
  real exceptions, children, changes, contact.
- `apps/web/app/components/cookie-consent.tsx`: banner names all three
  gated tools, not just PostHog.
- `apps/web/app/terms/page.tsx`: §3 Accounts gains the 16+ eligibility
  sentence (backs privacy §10; e2e heading numbering unchanged).

## Controller identity (open)

§1 initially shipped with a visible `[OPERATOR LEGAL NAME AND
REGISTERED ADDRESS]` placeholder; the owner removed it the same day,
pending the entity/name decision (identity stays private per standing
rule, so the choice is theirs). §1 now names "Tensorcraft" as the
controller with no legal identity behind it. The page is deployable,
but the Art. 13(1)(a) gap stands until the owner adds the legal entity
(or sole trader) name and a registered address. A JSX comment in §1 and
the backlog §7 block both track it.

## Terms of Service addendum (same day)

Owner asked the same question of /terms. Verified true against code:
Module 1 free without account, USD-only checkout, 14-day refund copy
matches /pricing badge, repos created public (github.ts default), token
revoked at GitHub AND nulled in DB on disconnect (stronger than the §6
claim), lifetime access (valid_until schema-only, unused by the API).

Fixed on "go": §3 rewritten for guest checkout (the old text claimed an
account is required to purchase; guest-account.ts auto-creates one from
the checkout email after payment), §9 dropped "in-app notification"
(inbox feature removed 2026-08-14; email is the only channel), date
bumped March 10 to August 16, 2026. Section numbering unchanged so
e2e legal.spec heading assertions hold.

Lawyer-tier gaps left for counsel (backlog §7): no governing-law or
termination clause, §8 liability exclusion needs a statutory-rights
carve-out for EU/UK consumers, §5 IP claim overreaches vendored
open-source (tfjs is Apache-2.0), no privacy-policy cross-link, and
guest buyers never pass an explicit terms-acceptance step.

## Deferred

Tracked in `docs/post-launch-backlog.md` §7 (2026-08-16 block):
github_token encryption, PostHog person-deletion propagation + email
scrub of pre-2026-08-16 persons, legacy waitlist re-consent, cert page
noindex, tc_world consent posture, owner confirmations (legal entity,
privacy@ mailbox, Supabase region).
