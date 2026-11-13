# Analytics Event Verification

Per dev-plan §6i, every event in `apps/web/lib/analytics-events.ts`
(which mirrors PRD Appendix B) must land in the PostHog EU dashboard
before launch. This doc is the verification protocol.

The typed registry in `apps/web/lib/analytics-events.ts` defines current event
names and payloads. The recipes below describe how to verify capture. Unit
tests establish local behavior. Live Events establishes deployed ingestion.

The [November 11 measurement follow-up](audits/seo-geo-2026-11-11-baselines/measurement-fix.md)
updates browser traffic labels and payment payloads in the deployed release.
Migration 067, API release 35, the web consent flow and PostHog settings are live.
Eight live consent API checks pass. Broader browser consent behavior and
consented server-event delivery remain unverified. See the
[release evidence](audits/seo-geo-2026-11-11-baselines/deployment.md).

The later [production browser check](audits/seo-geo-2026-11-11-baselines/browser-followup.md)
observed a guide CTA, matching tensor-shapes arrival and incorrect unassisted
experiment submission in one SDK session. All three carry `tc_internal=true`
and disappear with project test exclusions enabled. This verifies those
released browser events. The separate lesson-arrival follow-up was promoted
at 12:49 UTC as part of the eight-file SEO release. A browser accepted late
consent at 12:55:25.574 UTC. The settled PostHog read records one
`consent_granted` and one `$pageview` at 12:55:26.839 UTC, followed by one
`lesson_started` for tensor-shapes at 12:55:26.847 UTC. All three are marked
internal and share one SDK session. The bounded query contains no introduction
arrival. This closes the narrow late-consent delivery check. SPA navigation,
withdrawal/reacceptance, signed-in persistence and server payment capture
remain outside the completed check.
[Delivery evidence](audits/seo-geo-2026-11-11-baselines/posthog/browser-late-consent-verification.json).
[Release evidence](audits/seo-geo-2026-11-11-baselines/release/seo-followup-build.json).

## Verification approach

Playwright network-intercept was considered and **deferred** in favor of
manual dashboard confirmation - reasons:

1. PostHog's ingest URL varies by region and batching window; asserting
   on payload shape in e2e is brittle.
2. The typed `track()` helper is unit-tested (`analytics-events.test.ts`)
   so the wire-up guarantee lives there. The remaining risk is PostHog
   config drift (wrong API key, EU host unreachable) which manual checks
   catch in ~2 minutes.

Re-run this checklist after any PostHog key/host change and before each
production release.

## Preconditions

- `NEXT_PUBLIC_POSTHOG_KEY` set for the preview/staging environment.
- Signed in to <https://eu.posthog.com> with access to the Tensorcraft
  project.
- Live Events feed open (Activity → Live events) filtered by your
  `distinct_id` so only your session shows up.

## Per-event trigger recipe

| Event | Trigger | Expected properties |
| --- | --- | --- |
| `world_selected` | Complete onboarding with a world picked | `worldId`, `source="onboarding"` |
| `onboarding_step_viewed` | Each wizard step render (mount + every advance/back) | `step` (1–4), `stepName` |
| `onboarding_completed` | Click "Start Deep Orbit" on the Ready step (fires after PATCH succeeds) | `experienceLevel`, `learningGoal`, `yearsExperience?` |
| `lesson_started` | Current lesson visit once analytics is ready, including late consent. Released November 11, with one current-lesson arrival verified after late consent in production. | `worldId`, `moduleId`, `lessonId` |
| `lesson_step_viewed` | Every step entry: mount, Continue, back-nav, step-bar jump | `step` (0-4), `stepsVersion=2`, `stepName`, `prevStep?`, `prevStepMs?`, `revisit` |
| `script_skipped` | Skip intro button; Continue past a playing scene; the remembered preference suppressing playback | `step=0`, `elapsedMs`, `via` (`button`/`continue`/`auto`) |
| `script_finished` | Let the Briefing scene play to its natural end | `step=0`, `elapsedMs`, `run` (`auto`/`replay`), `briefingVariant` |
| `scene_clip_played` | Briefing scene clip starts (autoplay or the play control), clip-variant browsers on lessons with an approved clip | `trigger` (`auto`/`manual`) |
| `scene_clip_completed` | The clip reaches its natural end | `watchedMs` |
| `hint_requested` | On a lesson step with hints: click "Reveal Nudge" | `hintLevel=1`, plus context ids |
| `exercise_attempted` | Submit an exercise (any outcome, including a crashed or timed-out run) | `passed`, `score`, `exerciseSlug`, `durationMs`, `hintsUsed`, `errored?` |
| `exercise_completed` | Submit a passing exercise | `score`, `exerciseSlug` |
| `checkpoint_submitted` | Answer an in-lesson quiz | `passed`, `attempts` |
| `recall_answered` | Click "Reveal Answer" (`action="revealed"`), then rate (`got-it`/`review`) | `action` |
| `lesson_completed` | Reach step 6 (Consequence) of a lesson | `worldId`, `moduleId`, `lessonId`, `durationMs`, `hintsUsed` |
| `consent_granted` | Accept the cookie banner in a fresh browser profile (fires once per browser) | `source="banner"` |
| `module_completed` | Finish the last lesson of a module | `lessonsCount` |
| `paywall_hit` | Visit a Module 2+ lesson without access | `worldId`, `moduleId` |
| `pricing_page_viewed` | View `/pricing` after analytics is ready, including late consent | `entryContext`, optional legacy `source` and `lockedWorldId` |
| `checkout_started` | Click a paid-tier CTA on `/pricing` | `planId` |
| `signup_completed` | Reserved for verified account creation. The released session listener emits no event for generic `SIGNED_IN` callbacks. | No current authoritative registration capture. |
| `payment_completed` | Server-side: a paid or zero-charge Stripe checkout, or a successful delayed payment. Released version 2 removes the browser receipt event. | `planId`, `worldIds`, `sessionId`, `eventSource="stripe_webhook"`, `analyticsVersion=2`, `stripeEventId`, `paymentIntentId`, `amountMinor`, `currency`, `livemode`, `paymentKind`, legacy `amount` |
| `purchase_access_granted` | Server-side: an upgrade covered entirely by credit, with no new cash charge. | `planId`, `worldIds`, `grantId`, `reason="upgrade_credit"` |
| `payment_failed` | Server-side: Stripe `async_payment_failed` (use a test card) | `sessionId`, `reason` |
| `payment_refunded` | Server-side: a refund updates a charge. Released version 2 captures the cumulative refunded amount. | `paymentIntentId`, `isFullRefund`, `sessionId`, `chargeId`, `stripeEventId`, `eventSource="stripe_webhook"`, `analyticsVersion=2`, `currency`, `livemode`, `amountRefundedMinor` |
| `streak_achieved` | Complete a lesson after 24h of prior completion | `streakDays` (read back from the streaks table since 2026-09-04; previously hardcoded 1) |
| `session_started` | Begin a visible interval with initialized analytics and current consent | `sessionId` |
| `session_ended` | End that visible interval on hide/unload, once | Matching `sessionId`, `durationMs` since the consented interval started |
| `upgrade_cta_shown` | Land on `/pricing?locked=<launched-slug>` (fires headlessly from `<PaywallNotice>`; the visible banner was removed 2026-09-15), OR `/paywall` mounts | `source="paywall"`, `worldId?` |
| `upgrade_cta_clicked` | Click "See Plans" on `/paywall` hero or footer | `source="paywall"` |
| `free_lesson_cta_clicked` | Click a free-lesson CTA: the `/learn` hero or footer, the landing hero "Start Mission: Deep Orbit" or closing "Start Module 1" (since 2026-11-02), the `/pricing` closing "Start Module 1" (since 2026-11-02), or the trailer end card on a world page | `source` (`learn_hero`/`learn_footer`/`landing_hero`/`landing_footer`/`pricing_footer`/`world_trailer_endcard`) |
| `learn_trailer_played` | `/learn` hero loop begins, or "Watch the trailer" opens the full cut (only once trailer assets ship) | `mode` (`loop`/`full`) |
| `world_trailer_played` | World-page trailer band opens the lightbox cut (only once `/media/<slug>-trailer.mp4` ships; prospects only, no loop mode on this surface) | `worldId`, `mode="full"` |
| `progress_shared` | Capstone "Share" button OR "Share Link" on certificate card (copy to clipboard) | `platform="copy"`, `worldId` |
| `code_pushed` | Server-side: `POST /api/github/commit` or `/retroactive-push` succeeds | `worldId`, `lessonId`, `exerciseSlug`, `commitSha` |

`free_lesson_cta_clicked` counts activations after hydration: mouse clicks
(Cmd, Ctrl and Shift clicks included), Enter and taps. Middle-click and
context-menu or long-press opens send nothing at every placement, so the
event runs lower than `lesson_started`. A click before hydration also sends
nothing, which rarely matters: PostHog starts only for a visitor who accepted
the banner, and the banner appears after hydration.

## SDK events and data hygiene (added 2026-10-03)

posthog-js sends these itself. Check them in the same Live session, with
two tabs of the site open for at least a minute:

| Event | Expected |
| --- | --- |
| `$pageview` | Exactly one per hard load and one per client-side navigation to a new URL (only a repeat of the last captured URL is skipped). `$current_url` is the full URL from posthog-js. Before 2026-10-03 every hard load with stored consent counted twice, and `$current_url` on `$pageview` was a relative path: group by `$pathname` across that date. |
| `$pageleave` | On tab close, reload or a full-page navigation away (`capture_pageleave: true` since 2026-10-03). It carries the last page's duration and scroll depth; earlier pages get theirs from the next `$pageview`'s `$prev_pageview_*` properties, so before that date only the last page of each visit lacked them. |
| `$opt_in` | None. Opt-in is measured by `consent_granted`, and the SDK event is suppressed (`captureEventName: false`). Any `$opt_in` volume means the cross-tab storage loop is back; see `docs/observability.md`. |
| `$autocapture` | No email or name in `elements_chain`. Clicking the user-menu button still captures, with only `aria-label="User menu"`: its avatar is decorative (no name in any attribute) and passes clicks through. |
| `$dead_click` | Only if dead-click capture is enabled in the project: no name, email or GitHub handle in `$el_text` or the elements. Identity text carries `ph-no-capture`, which drops the event. |
| Session replay | Off since 2026-11-12 (`disable_session_recording`, `enable_heatmaps: false` and `enable_recording_console_log: false` in `apps/web/lib/posthog.ts`). After a release, confirm that no new recordings or heatmap data appear. |

## In-lesson instrumentation (added 2026-09-04)

Shipped as step 1 of `docs/audits/lesson-format-audit-2026-09-04.md`,
which found the funnel between `lesson_started` and `lesson_completed`
unmeasurable. How to read the new metrics:

- **Step funnel / dropoff**: `lesson_step_viewed` per step, filtered
  `revisit=false` for first-view survival curves. Dwell per step is the
  NEXT view's `prevStepMs`; the final step's dwell is deliberately
  unmeasured (unload handlers lose to tab close often enough that a
  partial number would mislead). Version 2 combines teaching and code in
  Concept and adds the visual workbench. Group numeric `step` and `prevStep`
  by `stepsVersion` (absent means legacy version 1); use `stepName` for
  semantic comparisons. Historic Code dwell remains historic Code dwell.
  Baseline capture: `scripts/analytics/module1-baseline.mjs` and
  `docs/audits/module1-baseline-template.md`.
- **Honest narrative skip rate** (the >40% redesign rule, and the video
  investment gate): `script_skipped` (all `via` values) divided by
  (`script_skipped` + `script_finished` where `run="auto"`).
  Reduced-motion visitors emit neither and are correctly excluded.
  History note: before 2026-09-04 the rate was biased low by
  construction; skip counts from before that date are not comparable.
- **Time on lesson**: `lesson_completed.durationMs` is mount-to-Epilogue
  for the completing session; cross-session truth is the sum of
  `prevStepMs`.
- **Earned-pass rate** (the learning-evidence query): exercise passes
  with `solutionViewed=false` and `hintsUsed < 3`, from
  `exercise_attempts` (now also carrying `duration_ms` and `hints_used`)
  or the `exercise_attempted` event. Crashed/timed-out runs now record
  with `errored=true`, `passed=false`.
- **Consent opt-in rate**: `consent_granted` unique persons divided by
  log-drain unique visitors over the same window. The decline side
  emits nothing on purpose: the banner promises analytics only on
  accept. (A cookieless server-side decline counter was considered and
  left as an owner decision, since it needs a privacy-policy judgment.)
- **world_progress.hints_used / .attempts** now populate on genuine
  completions (max-across-sessions for hints, sum for attempts).

## Stripe server-side events

Use a configured Stripe test-mode environment and fixtures that match the
API's required purchase metadata. Generic CLI fixtures may exercise a webhook
without identifying a Tensorcraft purchase. The event names for test triggers
are:

```sh
stripe trigger checkout.session.completed
stripe trigger checkout.session.async_payment_failed
stripe trigger charge.refunded
```

Confirm each event arrives under the originating account's `distinct_id`.
Inspect `eventSource`, `analyticsVersion`, `livemode`, `sessionId`, currency
and minor-unit amounts. Browser receipt views must not emit a purchase in the
released version. Repeated webhook delivery must not add another cash checkout
to a report deduplicated by `sessionId`. Record retries and missing captures
instead of assuming delivery exactly once.

Version 2 cash reports require `eventSource="stripe_webhook"`,
`analyticsVersion=2`, `livemode=true`, `paymentKind="cash"` and a valid
checkout `sessionId`. Reconcile the deduplicated sessions with Stripe records.
Keep `no_charge`, `unknown`, test-mode and credit-only grants separate. Use
`amountMinor` with its `currency`. The legacy `amount` field contains USD
dollars when known and otherwise can be null.

Refund events report the cumulative `amountRefundedMinor` for a charge. Never
sum those snapshots as separate refunds. Reconcile the latest charge state or
Stripe refund records before calculating refunded or net revenue.

The released server SDK logs safe error types and attempts to flush pending
events during graceful shutdown. Capture failures do not interrupt payment
fulfillment. These protections do not establish production delivery.

## GitHub server-side events

`code_pushed` is emitted from the Hono API (`apps/api/src/routes/github.ts`)
whenever `commitLessonArtifact` succeeds - same authoritative pattern as
`payment_completed`. Verify in staging by:

1. Connect GitHub from `/settings` (OAuth round-trip).
2. `curl -X POST $API_URL/api/github/commit -H 'Authorization: Bearer <jwt>' \
   -d '{"worldId":"deep-orbit","lessonId":"intro-tensors","code":"// noop"}'`.
3. Confirm a `code_pushed` event appears under your Supabase `auth.users.id`
   with `worldId`, `lessonId`, `exerciseSlug`, `commitSha`.

## Diagnosing a missing event

1. Browser console → look for "PostHog" warnings. If `capture` is being
   called but the event isn't arriving, verify `NEXT_PUBLIC_POSTHOG_HOST`
   is the EU ingest host `https://eu.i.posthog.com` (`eu.posthog.com` is
   the dashboard; a US host is the wrong project).
2. `localStorage.ph_<key>_posthog` - PostHog persists user ids here; if
   missing, init never ran. Check the consent gate:
   `apps/web/app/components/analytics-provider.tsx`, subscribed through
   `onConsentChange` in `apps/web/lib/consent.ts`, which reacts to the
   `tc-cookie-consent` key only.
3. Server events: check Fly.io logs for `Webhook: Failed to capture`, or
   a missing `POSTHOG_PROJECT_TOKEN` / `POSTHOG_HOST` secret.
4. Events missing only when two tabs are open: look for `$opt_in` or
   `$$client_ingestion_warning` ("client rate limited") in Live. Either
   means the cross-tab storage loop is back (`docs/observability.md`,
   PostHog item 5) and the rate limiter is dropping real events.

## Done criteria (§6i checklist)

- [ ] Every event in the table above appears in Live Events at least once.
- [ ] Each event carries the expected property keys (spot-check payloads).
- [ ] `distinct_id` matches Supabase `auth.users.id` for signed-in users.
- [ ] EU host (`eu.posthog.com`) confirmed in network tab.

> **Note (2026-04-21):** Final dashboard verification is pending first
> production PostHog session - the checklist above requires a live
> PostHog project with real events. Current wiring status: all 20 events
> defined, unit tests green, server-side emits wired for Stripe + GitHub,
> consent gating in place. See `session_2026_04_21.md` in user memory
> for session-level wiring details.

Check off boxes + commit this file with the commit message
`docs: verify PostHog event taxonomy §6i`.


## SEO and GEO cohort definitions (2026-11-10)

Use verified SDK session/referrer/campaign fields from the actual project.
Inspect Live Events before assuming which automatic properties are available.
The application event `source` commonly names a button placement or page
context. It does not establish an external acquisition channel.

| Measure | Definition | What it establishes |
| --- | --- | --- |
| Guide landing | A consented pageview of the guide's canonical path. | An observed visit within analytics coverage. |
| Guide handoff | `free_lesson_cta_clicked` with `source=guide`, guide ID, target lesson and placement. Deduplicate by observed SDK session for a session rate. | Someone chose to enter the activity. |
| Submitted activity | `experiment_submitted` or `exercise_attempted` after the handoff, with the matching lesson in the same observed journey. Include failed attempts and label them separately from passes. | A submitted attempt, not independent mastery or necessarily edited starter code. |
| Free-module completion | `module_completed` for Deep Orbit foundations, after confirming deployed guest and account capture. | Recorded completion within the available coverage. |
| Purchase | Settled server `payment_completed`, checked against payment records and deduplicated by checkout session. | A completed payment, not retention or learning success. |

Calculate a guide-to-attempt rate from consented guide sessions and matching
consented attempts. Do not divide all server purchases by consented browser
sessions and call it the site conversion rate. Report total settled purchases,
refunds and unknown acquisition separately. Attribute purchases to an analytics
cohort only where the observed identity/journey supports the join. Search
Console query aggregates do not provide a query-to-individual-purchase join.

Custom session events now describe visible intervals. They are distinct from
the SDK's own session identifier. A hidden tab ends one interval; returning
starts another. Consent withdrawal discards the current interval without an
end event. Reacceptance starts a new interval and observes the current page.
No pre-consent actions are queued or replayed.

The November 11 released lesson-arrival follow-up observes only the current visit
once analytics is ready. It does not duplicate that visit on withdrawal and
reacceptance or replay a lesson left before consent. Progress saving remains
independent. A lesson arrival does not establish an attempt. Step dwell and
lesson-completion duration retain their existing timing semantics, which may
include time before consent. Do not label those durations consent-only.

Pricing now uses `entryContext=standard`, `locked_lesson`, or
`checkout_cancelled`. The historical fallback `source=direct` must not be used
to classify direct acquisition. Internal article links no longer set campaign
UTMs. Their existing `digest_link_clicked` event carries content context.

The optional checkout-source question remains disabled by owner choice on
2026-11-10. The [November 11 account baseline](audits/seo-geo-2026-11-11-baselines/README.md)
uses the connected PostHog project and a new OpenSEO project. PostHog reports
2 visitors, 45 SDK sessions and 139 pageviews for October 12 to November 8.
Its configured internal/test cohort contains zero people, so the population
may include owner or test activity. Search Console now uses the verified
`sc-domain:tensorcraft.app` property. Its final web-search data records 1 click
and 70 impressions for October 12 to November 8, in Pacific Time. The previous
28-day window, September 14 to October 11, records 4 clicks and 69 impressions.
These search aggregates cannot identify an individual purchase journey.

The [first GEO sample](audits/seo-geo-2026-11-11-baselines/geo/findings-2026-11-11.json)
returned 34 answers, two upstream failures and zero no-answer results.
OpenSEO recorded 0/34 Tensorcraft mentions and 0/34 own-site citations.
Twenty-three Google redirect URLs remain unresolved, so the citation count
retains the provider's attribution limit. Exclude failed observations from
the answered denominator. These results measure this sample of AI answers,
not visits, purchases or a visibility trend. The
[private report](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/reports/faddb2f6-fed3-4397-a0cc-992419c10721)
preserves the interpretation. Recurrence is disabled. The approved cap was
216 credits ($0.216), and the provider did not return the actual debit.

The baseline's 204 `signup_completed` events for one person cannot establish
registrations. The old source emits on repeated sign-in callbacks. The released
follow-up removes that emitter. Registration counts remain unknown until an
authoritative account-creation signal exists. A recent account timestamp alone
does not establish that a generic sign-in created the account.

Both baseline `payment_completed` records are browser events without checkout
settlement IDs. The released follow-up removes browser receipt capture and adds
the version 2 server payload above. Historical browser confirmations remain
separate from verified payment records. Exercise submissions, free-module
completion, production server settlements and refunds still need ingestion
verification.

## November 11 internal traffic and delivery follow-up

Live project 257980 keeps the cohort 221371 exclusion and adds event filters
that exclude `tc_internal=true` and development or preview hostnames. It now
enables internal/test exclusions by default. The cohort still has zero members,
so these changes do not retrospectively identify unmarked owner activity.
Preserve the dated baseline before reporting a new external-visitor cohort.

The released browser SDK labels every outgoing event through `before_send`.
Only `tensorcraft.app` and `www.tensorcraft.app` count as public hostnames.
Other hostnames carry `tc_internal=true`. On a public host,
`?tc_internal=1` persists the internal marker in `tc-internal-traffic` across
sign-out. `?tc_internal=0` clears that marker. These labels and controls do
not bypass analytics consent. Verify the label on production browser events,
including SDK events and account changes.

A controlled `analytics_ingestion_check` event used the local API environment
and matched the live project. Its `tc_internal=true` record returned once
without exclusions and zero times with the configured test-account filter.
The hostname-negative filter alone retained it once, which verifies that
hostless server events can remain visible. This check establishes the local
configuration and SDK delivery path. It does not establish that production
Fly secrets or deployed webhook ingestion work.

A separate read-only Stripe check verified the live account's Tensorcraft
domain and found one paid checkout created from October 12 through November
8, UTC, for 5,000 USD minor units ($50). Supabase contains one matching
purchase row for that checkout session, with completed status and the same
amount. This verifies one paid checkout in a creation-date cohort. It does
not establish a settlement-date revenue total, a site conversion rate or
source attribution. Switching Fly to the owning account restored production
access. The initial inspection found both machines missing the PostHog settings
and running the earlier payment code. Protected API release 34 has since
deployed with passing health and source-hash checks on both machines. The web
release is promoted and its pages and assets pass HTTP checks. Eight live API
checks verify grants and withdrawal. Release 35 enables the expected PostHog
project token and EU host on the same protected image. Both machines pass
runtime-setting and health checks. Actual consented server-event delivery,
including webhook ingestion, still needs verification. The
[measurement record](audits/seo-geo-2026-11-11-baselines/measurement-fix.md)
preserves the evidence and remaining checks. Follow-up helper inspection
coincided with failed health checks. Temporary-process cleanup restored one
machine, and a restart restored the other. Future ingestion checks must account
for the 256 MB memory limit and avoid another parallel SDK bootstrap.

## Server consent release checks (2026-11-11)

The [consent repair](audits/seo-geo-2026-11-11-baselines/server-consent-fix.md)
adds authenticated account preferences. Migration 067 completed in production
at 11:01:47 UTC, and all 15 catalog checks pass. Protected API release 35 is live
with verified PostHog settings and passing health checks on both machines.
The promoted web release passes public page and asset checks. Eight live API
checks verify missing-choice defaults, grants, stale conflicts and withdrawal.
Full browser runtime and live server-event delivery remain unverified in the
[deployment record](audits/seo-geo-2026-11-11-baselines/deployment.md).
Verify these cases through the released browser interface and
normal application:

- Earlier browser acceptance prompts for a fresh choice. No saved account
  choice defaults to off.
- A fresh acceptance saves the account choice. A consented server action
  reaches PostHog after fulfillment.
- Cookie settings stops browser capture immediately. An acknowledged account
  withdrawal suppresses the next server event, including a delayed webhook.
- Failed saves remain visible and retry after reconnecting. A stale grant
  cannot replace a later withdrawal.
- A declined choice or failed consent lookup leaves the underlying purchase
  or GitHub action successful. Automatic server exception capture stays off.

Consent checks cannot recall events already queued or sent. Server analytics
observes a consented subset, so reconcile payment counts against Stripe.
