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

**A daily digest** at 07:23 UTC (`.github/workflows/daily-digest.yml`, added
2026-08-24), which is the ABSENCE detector. Everything else here fires when
something happens; nothing fires when something stops. Signups going to zero,
purchases drying up, the webhook falling silent: no event, so no alert.

It reports signups, purchases, waitlist and lessons started over 24h and 7d,
and **a missing digest is itself the signal** that the job or its
infrastructure died. It also does the one reconciliation nothing else does,
**Stripe's paid-session count against rows in `purchases`**: drift means
someone paid and was not recorded, the most expensive silent failure the
product has, and it changes the subject line so you see it without opening the
mail.

It fails red rather than skipping when it cannot send, per the house rule in
`partitions.yml`: never a silent green. A digest that quietly stops sending
looks exactly like a quiet week, which is the thing it exists to distinguish.

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

## Browser-side data errors (built 2026-08-24)

The gap that mattered most, and the one no tool could have closed.

This app performs 35 PostgREST operations directly from the browser, bypassing
the API. Several are writes: three progress upserts, every waitlist capture
surface, onboarding completion, settings. All of them swallowed their errors,
which is correct for the UI and invisible to every tool in this document,
because server Sentry, uptime monitors, synthetic checks and the Stripe
dashboard all sit on the server or outside the app.

The waitlist CHECK-constraint bug is the proof: it broke every capture surface
on the site for months and nothing noticed, because the failure happened in the
browser.

`lib/report-data-error.ts` now reports them, wired at four sites so far:
`waitlist.insert`, `progress.markLessonStarted`, `progress.markLessonCompleted`
and `progress.updateExerciseProgress`.

Three decisions worth knowing:

- It uses the **same `source` tag name the API sets**, so one Sentry alert rule
  covers both sides of the app.
- It **fingerprints on source plus Postgres error code**, so one broken
  constraint is one issue rather than one per occurrence.
- It **scrubs email addresses from everything it forwards**, including the
  database's own `details` field. PostgREST returns the offending row on a
  constraint violation, and for the waitlist table that row contains the
  subscriber's email. `beforeSend` scrubs `event.user` and headers but not
  `extra`, so this had to be handled here.

Expected-failure paths stay quiet: a duplicate waitlist signup (23505) is a
success, and an upsert conflict in `markLessonStarted` only reports if the
fallback SELECT also comes back empty.

Still uninstrumented: onboarding completion and the settings writes. Same
helper, same pattern, not yet applied.

## What you need to do

Six tasks. Total time about an hour. Ordered by value, and each one ends
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

### Task 4: Heartbeats for the scheduled jobs (10 min, free)

**Why:** the two scheduled workflows fail loudly, but a job that never STARTS
says nothing at all. `partitions.yml` is the one with a date attached:
`skill_events` partitions were pre-created only to **2027-04-01**, and that
job exists solely to extend them. If it silently stops, inserts start failing
at the cliff.

This is not theoretical. On **2026-08-24** a scheduled run was refused with
"the job was not started because recent account payments have failed or your
spending limit needs to be increased". A billing condition, nothing to do with
the code, and nobody noticed. GitHub also disables scheduled workflows after
60 days of repository inactivity, which is entirely plausible for a solo
project between pushes.

**Steps**

1. In BetterStack (same account as Task 1): **Monitors**, then **Heartbeats**,
   then create two.

   | Name | Expected period | Grace |
   |---|---|---|
   | Partitions (monthly) | 1 month | 2 days |
   | News scrape (weekly) | 1 week | 1 day |

   Sentry Crons and healthchecks.io work identically; the workflows accept any
   URL that responds to a plain GET.

2. Copy each heartbeat URL into a **GitHub repository secret**: Settings,
   Secrets and variables, Actions.

   - `HEARTBEAT_URL_PARTITIONS`
   - `HEARTBEAT_URL_NEWS_SCRAPE`
   - `HEARTBEAT_URL_DAILY_DIGEST` (daily period, 6 hour grace)

   The digest additionally needs `RESEND_API_KEY` to send at all, plus
   optionally `STRIPE_SECRET_KEY` for the payment reconciliation and
   `OPERATOR_ALERT_EMAIL` for the recipient. **Until `RESEND_API_KEY` exists
   that job goes red every morning**, deliberately: a red job is a truthful
   "not set up yet".

3. Nothing else. The workflows ping on success only, which is the whole point:
   no ping means alert, whether the job failed, was disabled, or was never
   allowed to start. Unset secrets are skipped with a notice rather than
   failing the job.

**Prove it works:** run `partitions.yml` manually (Actions tab, **Run
workflow**) and confirm the heartbeat registers as received. Then, if you want
the full test, wait out one grace period without running it and confirm you
get the alert.

---

### Task 5: Stripe dashboard notifications (5 min, free)

**Why:** Stripe sees failures our webhook never does, such as a card declined
before a session completes.

**Steps:** Stripe Dashboard, **Settings**, **Notifications**. Enable email for:
- Failed payments
- Disputes and chargebacks (redundant with our critical alert, deliberately:
  disputes are the one event where two notifications beat zero)
- Successful payments, optional, if you want a second source

---

### Task 6: Turn on Vercel Log Drains (10 min, Pro feature you already have)

**Why:** confirmed 2026-08-24, the team scope `amira-salahs-projects` is on
**Pro**. That unlocks Log Drains, which is the single thing that closes the
"no log history" gap for the web side. On Hobby, runtime logs are effectively
unqueryable minutes after the fact; mid-incident that is exactly when you want
them.

**Steps**

1. Vercel, project **tensorcraft**, **Settings**, **Log Drains**.
2. Add a drain pointing at the BetterStack source you created in Task 1, so
   uptime, status page and logs all live in one free account.
3. While you are in the dashboard: **Observability** in the sidebar now gives
   queryable runtime logs, and the **Alerts** panel does anomaly detection.
   Neither exists on Hobby.

**Also now available on Pro, worth knowing:**

- **Usage and spend alerts.** Set them; this partially closes the quota gap
  (for Vercel only, not Upstash or Supabase). The dashboard shows $20 of
  included credit per cycle, with Speed Insights already drawing against it.
- **Higher ceilings.** The 10K/month Speed Insights cap that used to be a real
  risk is gone, and bandwidth moves from 100GB to 1TB.

**What Pro does NOT change**, and this is the part worth being clear about:
the browser-side write blind spot below is untouched at any plan tier, because
those requests never reach Vercel. Neither is the Fly-hosted API, Supabase,
Upstash or Stripe.

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

- **No log aggregation for the API.** Fly logs are ephemeral and not
  searchable after the fact. The web side is solvable now via Vercel Pro Log
  Drains (Task 5); Fly has no equivalent free path, so the API stays blind.
- **No status page** until you create one; BetterStack's free tier includes it.
- ~~No alerting on business anomalies~~ **partially closed** by the daily
  digest, which makes a zero visible. Once-a-day resolution, so a same-day
  collapse still waits until morning. The scheduled jobs are covered by
  heartbeats (Task 4); nothing equivalent watches signups or purchases yet.
  That is what the daily heartbeat digest would close.
- **The synthetic checks run every 6 hours**, so a behavioural regression can
  live for up to 6 hours. The external uptime monitor is what closes the gap
  for availability; nothing closes it for behaviour.
- **Operator alerts depend on Resend.** If Resend is down you lose the
  notification and the receipt together, and nothing tells you that happened.
