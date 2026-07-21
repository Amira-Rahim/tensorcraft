# Retention Email Sequences (Kit) — Runbook + Copy

**Status:** copy drafted 2026-07-13; Kit automations NOT yet created (Kit
dashboard is operator-only). Code side is already live: the four lifecycle
tags (`signed_up`, `onboarded`, `first_lesson`, `capstone`) all have web
callers posting through `/api/email` (mounted at `apps/api/src/index.ts`).
This closes the "retention emails still pending" item from the 2026-06-09
funnel work. Indexed in `docs/post-launch-backlog.md` §1 (canonical
post-launch index).

## Sequences

### A. Unstarted (signed up, never opened a lesson)

- **Trigger:** tag `signed_up` added.
- **Exit:** tag `first_lesson` added (Kit automation exit condition).
- **A1, +1 day** — subject: `Module 1 is free. The pager is already on.`
  Body: You made an account and then the real world happened, that is
  fine. Module 1 of Deep Orbit is free, no card, about an hour end to end.
  The first lesson takes fifteen minutes and ends with real TensorFlow.js
  running in your browser. Link: /themes/deep-orbit.
- **A2, +3 days** — subject: `One analogy, free: Array.reduce() is a neuron`
  Body: The whole course works like this: 55 bridges from frontend
  concepts you already know to the ML concept they secretly are, each one
  labeled where the analogy breaks. Here is the first one in full
  [short reduce/neuron bridge inline]. If that clicked, lesson one is
  where it starts paying off. Link: /themes/deep-orbit.

### B. Started, stalled (opened a lesson, then went quiet)

- **Trigger:** tag `first_lesson` added.
- **Wait:** 7 days, THEN send only if the subscriber has not received
  sequence C (Kit condition: tag `capstone` absent).
- **B1, +7 days** — subject: `DISPATCH logged your last transmission`
  Body (DISPATCH register): Operator, your board still shows an open
  module. The detector you started building has not moved since your last
  session; the signal has. Fifteen minutes puts you one lesson further
  than most people ever get. Link: /dashboard.

### C. Finisher (capstone reached)

- **Trigger:** tag `capstone` added.
- **C1, immediate** — subject: `Board clear. Certificate desk is open.`
  Body: You shipped the capstone. Your certificate is ready, your solved
  exercises are in your GitHub repo, and the model you trained is yours.
  If the course earned it, a sentence about what clicked for you is the
  most useful thing you could send back, just reply. Link: /dashboard.

## Tag vocabulary (code side complete)

| Tag | Env var | Fired from |
|---|---|---|
| `signed_up` | `KIT_TAG_SIGNED_UP` | session listener |
| `onboarded` | `KIT_TAG_ONBOARDED` | onboarding completion |
| `first_lesson` | `KIT_TAG_FIRST_LESSON` | first lesson completed |
| `module_1_complete` | `KIT_TAG_MODULE_1_COMPLETE` | final lesson of module 1 (**new 2026-07-21**) |
| `paywall_hit` | `KIT_TAG_PAYWALL_HIT` | `<PaywallNotice>` on /pricing (**new 2026-07-21**) |
| `capstone` | `KIT_TAG_CAPSTONE` | capstone reached |
| `purchased` | `KIT_TAG_PURCHASED` | Stripe webhook (server-side) |

~~Known gap: there is no `purchased` tag.~~ **Resolved** — `KIT_TAG_PURCHASED`
is fired server-side from the Stripe webhook (`payments.ts:686`, `:887`), so
sequence B *can* distinguish a free-tier stall from a paid stall. Suppress
sequence B on `purchased`.

The two 2026-07-21 additions close the real gap, which was that nothing
tagged the highest-intent moment in the product: a learner who ran out of
free content. Sequence B should key off `module_1_complete` / `paywall_hit`
without `purchased`.

Both new tags degrade gracefully: an unset env var makes `/api/email` return
`{ ok: true, skipped: true }` rather than erroring, so the automations can be
built before or after the ids are configured.

## Operator checklist (Kit dashboard)

0. Set `KIT_TAG_PAYWALL_HIT` and `KIT_TAG_MODULE_1_COMPLETE` on the API host
   once the tags exist in Kit. Until then those two tags no-op silently.
1. Sender name "Tensorcraft", reply-to a monitored inbox.
2. Create the three automations above; exits exactly as specified so
   nobody gets a nudge for a stage they passed.
3. Links only to launched routes (/themes/deep-orbit, /dashboard); no
   /bridges, no coming-soon themes.
4. Kit's unsubscribe footer on every template (this is Kit-managed; the
   Resend digest's unsubscribe machinery is separate and already built).
5. Send every template to yourself once; click every link against prod.
6. Confirm the `email_alerts` tag question from the launch checklist while
   in the dashboard (does any automation consume it, else hide the
   Settings toggle).
