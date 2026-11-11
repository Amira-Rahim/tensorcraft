# Analytics Event Verification

Per dev-plan §6i, every event in `apps/web/lib/analytics-events.ts`
(which mirrors PRD Appendix B) must land in the PostHog EU dashboard
before launch. This doc is the verification protocol.

The typed registry in `apps/web/lib/analytics-events.ts` defines current event
names and payloads. The recipes below describe how to verify capture. Unit
tests establish local behavior. Live Events establishes deployed ingestion.

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
| `lesson_started` | Open any lesson (step 1 auto-fires) | `worldId`, `moduleId`, `lessonId` |
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
| `payment_completed` | Server-side: Stripe `checkout.session.completed` | `planId`, `worldIds`, `amount`, `sessionId` |
| `payment_failed` | Server-side: Stripe `async_payment_failed` (use a test card) | `sessionId`, `reason` |
| `payment_refunded` | Server-side: issue a refund in Stripe dashboard | `paymentIntentId`, `isFullRefund` |
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
| Session replay | Spot-check one recording of a signed-in session: the avatar, emails, names, GitHub handle and certificate names appear blanked (`ph-no-capture` blocks them). |

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

Use `stripe trigger` from the Stripe CLI pointed at the API:

```sh
stripe trigger checkout.session.completed
stripe trigger checkout.session.async_payment_failed
stripe trigger charge.refunded
```

Confirm each event lands within ~30s under the originating user's
`distinct_id` (not a session-level anonymous id).

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

Pricing now uses `entryContext=standard`, `locked_lesson`, or
`checkout_cancelled`. The historical fallback `source=direct` must not be used
to classify direct acquisition. Internal article links no longer set campaign
UTMs. Their existing `digest_link_clicked` event carries content context.

The optional checkout-source question remains disabled by owner choice on
2026-11-10. Account measurement will use integrations. PostHog and OpenSEO were
available but not installed at the last check, so account results remain
unverified until setup is complete. These definitions are a reporting contract,
not a claim that a live dashboard or baseline has been verified.
