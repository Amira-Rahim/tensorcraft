# Analytics Event Verification

Per dev-plan §6i, every event in `apps/web/lib/analytics-events.ts`
(which mirrors PRD Appendix B) must land in the PostHog EU dashboard
before launch. This doc is the verification protocol.

**Scope:** 20 events total - 15 originally defined plus 5 newly wired in
2026-04 (`session_started`, `session_ended`, `progress_shared`,
`code_pushed`, `upgrade_cta_shown`, `upgrade_cta_clicked`). All 20 are
defined in the typed `track()` helper, covered by unit tests
(`analytics-events.test.ts`), emitted either client-side with consent
gating or server-side for Stripe/GitHub flows.

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
| `session_started` | Log in (any auth flow) | `userId` |
| `world_selected` | Complete onboarding with a world picked | `worldId`, `source="onboarding"` |
| `onboarding_step_viewed` | Each wizard step render (mount + every advance/back) | `step` (1–4), `stepName` |
| `onboarding_completed` | Click "Start Deep Orbit" on the Ready step (fires after PATCH succeeds) | `experienceLevel`, `learningGoal`, `yearsExperience?` |
| `lesson_started` | Open any lesson (step 1 auto-fires) | `worldId`, `moduleId`, `lessonId` |
| `hint_requested` | On a lesson step with hints: click "Reveal Nudge" | `hintLevel=1`, plus context ids |
| `exercise_attempted` | Submit an exercise (any outcome) | `passed`, `score`, `exerciseSlug` |
| `exercise_completed` | Submit a passing exercise | `score`, `exerciseSlug` |
| `checkpoint_submitted` | Answer an in-lesson quiz | `passed`, `attempts` |
| `recall_answered` | Click "Reveal Answer" on a RecallPrompt | `action="revealed"` |
| `lesson_completed` | Reach step 6 (Consequence) of a lesson | `worldId`, `moduleId`, `lessonId` |
| `module_completed` | Finish the last lesson of a module | `lessonsCount` |
| `paywall_hit` | Visit a Module 2+ lesson without access | `worldId`, `moduleId` |
| `pricing_page_viewed` | Land on `/pricing` (any path) | `source` |
| `checkout_started` | Click a paid-tier CTA on `/pricing` | `planId` |
| `payment_completed` | Server-side: Stripe `checkout.session.completed` | `planId`, `worldIds`, `amount`, `sessionId` |
| `payment_failed` | Server-side: Stripe `async_payment_failed` (use a test card) | `sessionId`, `reason` |
| `payment_refunded` | Server-side: issue a refund in Stripe dashboard | `paymentIntentId`, `isFullRefund` |
| `streak_achieved` | Complete a lesson after 24h of prior completion | `streakDays` |
| `session_started` | App load / route into any page (fires from `AnalyticsProvider`) | `sessionId` |
| `session_ended` | Close/hide tab or navigate away (`visibilitychange`→hidden, `beforeunload`) | `sessionId`, `durationMs` |
| `upgrade_cta_shown` | `/pricing?locked=<slug>` banner renders, OR `/paywall` mounts | `source="paywall"`, `worldId?` |
| `upgrade_cta_clicked` | Click "See Plans" on `/paywall` hero or footer | `source="paywall"` |
| `free_lesson_cta_clicked` | Click any "Start Module 1 free" CTA on `/learn` | `source` (`learn_hero`/`learn_footer`) |
| `learn_trailer_played` | `/learn` hero loop begins, or "Watch the trailer" opens the full cut (only once trailer assets ship) | `mode` (`loop`/`full`) |
| `progress_shared` | Capstone "Share" button OR "Share Link" on certificate card (copy to clipboard) | `platform="copy"`, `worldId` |
| `code_pushed` | Server-side: `POST /api/github/commit` or `/retroactive-push` succeeds | `worldId`, `lessonId`, `exerciseSlug`, `commitSha` |

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
   is `https://eu.posthog.com` (US host = wrong project).
2. `localStorage.ph_<key>_posthog` - PostHog persists user ids here; if
   missing, init never ran (check `posthog-provider.tsx` consent gate).
3. Server events: check Fly.io logs for `Webhook: Failed to capture`
   or missing `POSTHOG_KEY` env var.

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
