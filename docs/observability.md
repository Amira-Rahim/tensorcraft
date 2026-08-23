# Observability

Written 2026-08-23, to answer one question: **how do I find out something
broke, or something happened, without a user telling me?**

Before this, the honest answer was that you did not. Sentry captured errors at
22 sites in the API and notified nobody, because alert rules live in a
dashboard that had none. PostHog had no project. Both health probes were
self-probes from inside the host, which is exactly the shape that cannot
detect down-and-silent. That is how the API certificate expired unnoticed for
weeks in July.

## What is now automatic

**Operator alerts by email**, sent over Resend from the Stripe webhook:

| Event | Severity | Why you want it |
|---|---|---|
| Purchase settled | info | The sale, and proof the whole money path worked end to end |
| Refund processed | info | Says whether access was revoked or retained |
| Chargeback opened | critical | Fixed evidence window, access already revoked automatically |

Sent to `OPERATOR_ALERT_EMAIL`, falling back to `SUPPORT_EMAIL`. Unset
`RESEND_API_KEY` makes it a logged no-op. It never throws and bounds its own
wait, because every call site is a webhook handler and an alert that hangs
would cost you a Stripe re-delivery.

At beta volume one mail per purchase is the right resolution. Revisit when
that becomes noise, which is a good problem.

**Synthetic checks** every 6 hours (`.github/workflows/synthetic-checks.yml`),
failing loudly to GitHub email: API readiness including a real database check,
the web serving `/`, `/pricing` and `/terms`, and the EU/UK geo-gate still
returning 403. That last one is the check a ping cannot make, and the one with
money attached: a silently-broken gate creates VAT liability from the first
sale that cannot be unwound.

It is deliberately NOT an uptime monitor. This repo is private, so Actions
minutes cap at 2000/month and CI already spends about 20 per push. A
15-minute cron would cost 2880/month by itself, since every run bills at a
one-minute minimum.

## What you need to do

Four tasks. Total time about 40 minutes. Ordered by value, and each one ends
with a way to prove it works, because an alert you never tested is a guess.

---

### Task 1: External uptime monitor (10 min, free) - DO THIS FIRST

**Why:** both existing probes run INSIDE the host, so neither can tell you the
host is unreachable. This is the exact gap that let the API certificate expire
unnoticed for weeks in July.

**Steps**

1. Sign up at <https://uptimerobot.com> (free tier: 50 monitors, 5-minute
   checks). BetterStack or Pingdom work identically.
2. Add three monitors. For each: **+ New monitor**, type **HTTP(s)**, interval
   **5 minutes**.

   | Friendly name | URL | Catches |
   |---|---|---|
   | Tensorcraft web | `https://tensorcraft.app` | Vercel down, DNS, certificate |
   | Tensorcraft API ready | `https://api.tensorcraft.app/api/health/ready` | Fly down, or Supabase unreachable |
   | Tensorcraft API alive | `https://api.tensorcraft.app/api/health` | Pairs with the row above |

3. Under **Alert contacts to notify**, tick your email. Install their mobile
   app and add push as well; an outage email in a crowded inbox at 2am is not
   an alert.

**Why both API monitors:** `/api/health` proves the process is running.
`/api/health/ready` runs a real database query. Alive UP plus ready DOWN means
the database, not the API. That distinction saves you the first 20 minutes of
an incident. Both are exempt from rate limiting, so polling is free.

**Prove it works:** add a fourth monitor pointing at
`https://tensorcraft.app/this-page-does-not-exist`, wait for the down alert to
reach your phone, then delete it. Do not skip this. An untested alert path is
the most common way monitoring silently fails.

---

### Task 2: Sentry alert rules (15 min, free)

**Why:** capture works in both apps, and as of 2026-08-23 the API forwards its
22 deliberate capture sites too (before that they went to logs only). Without
rules, all of it lands in a dashboard nobody opens.

**Steps.** Do this in BOTH Sentry projects (the API one and the web one):
**Alerts** then **Create Alert** then **Issues**.

**Rule 1, the money path.** Name: `Money path errors`.
- WHEN: *A new issue is created*
- IF: *The event's tags match* `source` *contains* `payments`
- THEN: *Send a notification to* your email
- Action interval: 5 minutes

Repeat the same rule with `source` containing `webhooks`, then `github`. The
`source` tag exists precisely so these filters work; every capture site sets
it (`payments.webhook`, `payments.receipt`, `payments.geo-backstop`,
`github.token`, and so on).

**Rule 2, bad deploy detector.** Name: `Error spike`.
- WHEN: *The issue is seen more than* `10` *times in* `5 minutes`
- THEN: email
- This catches a broken release faster than any user will report it.

**Rule 3, quieter.** Name: `Lesson errors, daily`.
- WHEN: *A new issue is created*
- IF: tags match `boundary` equals `lesson-error`
- THEN: email, action interval **24 hours**
- One learner hitting a transient fault is not an incident; fifty is.

**Also set `SENTRY_AUTH_TOKEN` in Vercel** while you are in there, or
production stack traces stay minified and your alerts point at unreadable
frames. Vercel project, Settings, Environment Variables, add for Production.

**Prove it works:** Sentry's onboarding has a "send test event" button per
project. Fire it and confirm the mail arrives.

---

### Task 3: Set two environment variables (5 min)

**On Fly** (the API):

```bash
fly secrets set OPERATOR_ALERT_EMAIL=you@yourdomain.com -a tensorcraft-api
```

Without it, purchase, refund and chargeback alerts go to `SUPPORT_EMAIL` and
sit among user mail. Setting it separates "something happened in the business"
from "a user needs a reply". Setting a secret triggers a rolling restart.

**On Vercel** (the web): `SENTRY_AUTH_TOKEN`, as covered in Task 2.

**Prove it works:** the next real purchase emails you. To test sooner, use
Stripe test mode, or just wait for your first sale, which is the event this
exists for.

---

### Task 4: Stripe dashboard notifications (5 min, free)

**Why:** Stripe sees failures our webhook never does, such as a card declined
before a session completes.

**Steps:** Stripe Dashboard, **Settings**, **Notifications**. Enable email for:
- Failed payments
- Disputes and chargebacks (redundant with our critical alert, deliberately:
  disputes are the one event where two notifications beat zero)
- Successful payments, optional, if you want a second source

---

### Later, not now: PostHog (20 min)

About 25 events are instrumented and currently land nowhere. Create the EU
project, set `NEXT_PUBLIC_POSTHOG_KEY` in Vercel, then walk
`docs/analytics-verification.md`.

Deliberately last. This answers "what are people doing", not "what broke". It
matters less than the four above for launch week, and more than all of them by
week two.

## What still will not tell you anything

Being explicit so the list does not read as complete when it is not:

- **No log aggregation.** Fly logs are ephemeral and not searchable after the
  fact. Fine at this scale, painful during an incident.
- **No status page.** Users cannot self-serve "is it down or is it me".
- **No alerting on business anomalies**, for example signups stopping. You
  would notice a spike, not a silence.
- **The synthetic checks run every 6 hours**, so a behavioural regression can
  live for up to 6 hours. The external uptime monitor is what closes the gap
  for availability; nothing closes it for behaviour.
- **Operator alerts depend on Resend.** If Resend is down you lose the
  notification and the receipt together, and nothing tells you that happened.
