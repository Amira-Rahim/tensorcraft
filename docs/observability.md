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

**Two more invariants in the synthetic checks** (added 2026-08-24):

- **RLS still denies anonymous reads**, probed with the public anon key across
  profiles, purchases, world_progress, skill_events and waitlist. RLS is
  declared in migrations and unit-tested against mocks; neither proves the LIVE
  policy holds. A regression there is a data breach that no error rate or
  uptime check would ever surface, because every request succeeds.
- **main has actually been deployed**, comparing HEAD against the last
  successful API deploy. On 2026-08-22/23 a misconfigured Vercel
  `ignoreCommand` cancelled every deploy for two days while the dashboard
  filtered the cancelled rows out of view. Nothing notices that: the site is
  up, healthy, and serving old code.

**Synthetic checks** every 6 hours (`.github/workflows/synthetic-checks.yml`),
failing loudly to GitHub email: API readiness including a real database check,
the web serving `/`, `/pricing` and `/terms`, and the anon-key RLS probe.
(The EU/UK geo-gate 403 probe lived here until 2026-08-31, when the owner
opened EU/UK purchases and the gate was removed.)

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

### Status, verified against live systems 2026-08-25

| Task | State | Evidence |
|---|---|---|
| 1. External uptime monitor | DONE | 3 UptimeRobot monitors at 5 min, all up; down alert tested and received |
| 2. Sentry alert rules | DONE | 6 rules created 2026-08-25 via API, verified by read-back, 3 per project |
| 3. Two environment variables | DONE | `SENTRY_AUTH_TOKEN` on Vercel. `OPERATOR_ALERT_EMAIL` set on BOTH Fly and GitHub Actions 2026-08-25, so the digest and operator alerts reach a real inbox rather than the support queue |
| 4. Heartbeats | DONE | 3 monitors armed. Proven by a real scheduled run 2026-08-25 08:03 UTC: digest sent, heartbeat delivered |
| 5. Stripe notifications | OPEN | dashboard only, not checkable from here |
| 6. Vercel Log Drains | DONE | `betterstack-production` drain, `lambda`+`edge`+`external`, production only. Delivery confirmed in Live tail 2026-08-25; 14 competing drains for unrelated projects removed |
| PostHog | DONE | EU project live 2026-08-26, events confirmed arriving |

Also now live, outside the numbered tasks: browser-side Sentry reports from
production (DSN present in `main-app`, correct project, Replay off), the API
carries `SENTRY_DSN`, and `GITHUB_TOKEN_ENC_KEY` encrypts stored tokens.

**Watch for:** the audit gate went red on commit `6d64eec` because the Sentry
wizard added `@sentry/nextjs` to the ROOT `package.json` as a production
dependency, dragging in `@opentelemetry/core@1.30.1`. The existing override
pins `@opentelemetry/core@2` only, so a 1.x copy walks straight past it.
Removing the root dependency and the six inert wizard files at the repo root
clears it.

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
an incident.

**Correction 2026-08-25, an earlier version of this file got it wrong.** Only
`/api/health` is exempt from the limiter. `/api/health/ready` is deliberately
NOT exempt, because it queries Supabase per hit, and there is a test pinning
that behaviour (`rate-limit.test.ts`, "still rate limits /api/health/ready").
Two consequences for an external monitor:

- **No 429 risk.** The limit is 60 requests per minute per subject
  (`rate-limit.ts:8`) and a 5 minute interval is one request per 300 seconds.
- **It is not free, it is cheap.** Each `/ready` hit spends Upstash commands
  (fixed window, 2 per request). At 5 minute polling that is roughly 17K
  commands a month against the 500K free tier, about 3 percent. Worth stating
  precisely rather than hand waving, because on 2026-08-17 health probes
  routed through the limiter burned ~98 percent of that quota, which is the
  entire reason `/api/health` is exempt today. Do not lower the interval below
  5 minutes on `/ready` without redoing this arithmetic.

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

**CREATED 2026-08-25 via the API, six rules, verified by read-back.** The
table below is what actually exists. An earlier version of this section
prescribed a rule filtering `source` *contains* `webhooks`, which was dead:
nothing emits that value. The webhook capture site tags `payments.webhook`,
already covered by the `payments` rule. A rule matching a tag value nothing
emits does not error or warn, it just sits there looking like coverage, which
is indistinguishable from "no errors happened".

The rules also differ per project, deliberately, because the two projects emit
different tags. Mirroring the API's filters into the web project would have
produced three more dead rules.

| Project | Rule | WHEN | IF | Every |
|---|---|---|---|---|
| api | `Money path errors` | new issue | `source` contains `payments` | 5 min |
| api | `GitHub integration errors` | new issue | `source` contains `github` | 5 min |
| api | `Error spike` | seen > 10 times in 5 min | - | 5 min |
| web | `Browser data write failures` | new issue | `source` **is set** | 5 min |
| web | `Error spike` | seen > 10 times in 5 min | - | 5 min |
| web | `Lesson errors, daily` | new issue | `boundary` equals `lesson-error` | 1440 min |

`source` is set in the web project ONLY by `reportDataError`, so "is set"
captures exactly the browser-side write failures and nothing else. That is the
blind spot the waitlist CHECK-constraint bug hid in for months, so it is the
single most valuable rule on the web side.

Verified tag values at time of writing. API `source`: `payments.webhook`,
`payments.receipt` (`payments.geo-backstop` retired 2026-08-31 with the
EU/UK gate), `github.token`,
`github.commitLessonArtifact`, plus `auth.signup`, `email.*`, `newsletter.*`,
`token-crypto`, `issues.*`. Web `source`: `waitlist.insert`,
`progress.upsert`, `progress.markLessonStarted`,
`progress.markLessonCompleted`, `progress.updateExerciseProgress`,
`onboarding.complete`, `settings.updateProfile`, `settings.updateAvatar`. Web
`boundary`: `lesson-error`, `route-error`, `global-error`, `auth-error`,
`settings-error`, `dashboard-error`, `onboarding-error`, `paywall-error`,
`pricing-error`, `world-error`, `worlds-error`, `certificate-error`.

**If you add a capture site, check its `source` value against this list**, or
it will report into Sentry and notify nobody.

**Also set `SENTRY_AUTH_TOKEN` in Vercel** while you are in there, or
production stack traces stay minified and your alerts point at unreadable
frames. Get it from Sentry, Settings, Auth Tokens, Create New Token; an
organization token (`sntrys_...`) arrives pre-scoped for source map upload.
Add it in the Vercel project under Settings, Environment Variables, for
Production. It is consumed at BUILD time, so it takes no `NEXT_PUBLIC_`
prefix and does nothing until the next deploy.

**Three traps, all hit on 2026-08-24 and all fixed:**

1. **The Sentry wizard configures the wrong directory.** Run at the repo root
   it wraps `/next.config.js` and writes `instrumentation-client.ts`,
   `sentry.*.config.ts` and `pages/` beside it. The Vercel project builds with
   `rootDirectory: apps/web`, so none of it is ever read. The wrapper has to
   live in `apps/web/next.config.ts`, which is where it now is. Without it the
   client SDK is never injected into the browser bundle and no source maps
   upload, so the auth token has nothing to attach to.

2. **`NEXT_PUBLIC_*` is inlined at build time.** Adding the DSN to an
   already-built deployment changes nothing. Always redeploy after, and verify
   by fetching a chunk and grepping for the ingest host rather than trusting
   the dashboard, which renders build-time and runtime variables identically.

3. **Sentry ingest is region scoped and CSP is exact.** Our DSN is on
   `ingest.de.sentry.io`. A `connect-src` wildcard for `*.ingest.sentry.io`
   does NOT match it, because the suffix differs. Miss this and every event is
   blocked in the browser, where no server side tooling can see it fail.

**Do not adopt the wizard's client config.** It enables `replayIntegration()`
with a 10 percent session sample. Session Replay records the DOM the user is
looking at, and `apps/web/instrumentation-client.ts` keeps it off on purpose:
Sentry runs outside the cookie consent gate as legitimate interest, which is
only defensible while events carry no screen content. Turning it on means
moving that init behind consent and disclosing it in `/privacy` first.

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

Provider: **Sentry Crons**, in the `tensorcraft-api` project. BetterStack
Heartbeats and healthchecks.io work identically; the workflows accept any URL
that answers a plain GET, which is exactly what Sentry's cURL guide emits.

1. Sentry, **Monitors**, **Create Monitor**, then **Manually Create a
   Monitor**. The SDK path instruments a long-running app, which is not what a
   workflow is. Project `tensorcraft-api`, schedule type Crontab, UTC.

   | Monitor slug | Crontab | Grace (min) | Max runtime |
   |---|---|---|---|
   | `partitions` | `17 3 1 * *` | 2880 | 30 |
   | `news-scrape` | `0 9 * * 1` | 1440 | 30 |
   | `daily-digest` | `23 7 * * *` | 900 | 30 |

   **Grace corrected 2026-08-31 from MEASURED data, the original 360 for the
   digest was wrong.** Actual lateness of the last six scheduled digest runs,
   against a 07:23 UTC cron: 41, 42, 337, 349, 657 and 726 minutes. Two of six
   blew past a 6 hour grace, so Sentry fired false "missed check-in" alerts on
   08-27 and 08-28 for a job that ran fine. 900 minutes (15 hours) covers the
   observed worst case with margin while still detecting a real miss the same
   day. Do NOT go to 1440: a full day of grace on a daily job means a genuinely
   missed run is indistinguishable from a late one.

   The lesson generalises. GitHub's scheduler is not "a few minutes late", it
   is HOURS late under load, and the delay is unpredictable rather than
   consistent. Size grace from measured history, not from intuition, and
   re-measure after a few weeks of real runs.

   Grace has to absorb GitHub's scheduler, which is best-effort and routinely
   runs late. A tight grace produces false alarms, and a channel that cries
   wolf gets ignored, which costs more than the miss it was meant to catch.
   Failure and recovery tolerance stay at 1: for a monthly job, waiting out a
   second failure means waiting another month.

   Leave the Alert section empty. Project-level rules already cover the issues
   these monitors raise.

2. **A new monitor is dormant, not armed.** Sentry will not detect a miss
   until it has seen one check-in, so a freshly created monitor looks
   identical to a healthy one and alerts on nothing. Arm each with a manual
   ping, which doubles as proof the URL is right:

   ```
   curl -fsS 'https://oORG.ingest.REGION.sentry.io/api/PROJECT/cron/SLUG/KEY/?status=ok'
   ```

   HTTP 202 means accepted. On the monitor page **Last check-in** stops
   reading `-` and **Next check-in** fills in. The three URLs differ only by
   SLUG, so deriving the other two from the first is faster than the UI.

3. Store each URL, `?status=ok` included, as a GitHub repository secret:

   - `HEARTBEAT_URL_PARTITIONS`
   - `HEARTBEAT_URL_NEWS_SCRAPE`
   - `HEARTBEAT_URL_DAILY_DIGEST`

   Use `env -u GITHUB_TOKEN gh secret set NAME`. An ambient `GITHUB_TOKEN`
   shadows the `gh` login and fails with a misleading 404 on the public-key
   endpoint rather than a permissions error.

4. Nothing else. The workflows ping on success only, which is the whole point:
   no ping means alert, whether the job failed, was disabled, or was never
   allowed to start. Unset secrets are skipped with a notice rather than
   failing the job.

The digest additionally needs both Supabase secrets and `RESEND_API_KEY` to
send at all, plus optionally `STRIPE_SECRET_KEY` for the payment
reconciliation. **Until `RESEND_API_KEY` exists that job goes red every
morning**, deliberately: a red job is a truthful "not set up yet".
`OPERATOR_ALERT_EMAIL` is genuinely optional, since both consumers fall back
to `SUPPORT_EMAIL` and then to `support@tensorcraft.app`.

**Status 2026-08-24:** all three monitors created, armed (HTTP 202 each) and
their secrets stored. Every other repo secret the digest needs is already
present, so it sends on its next scheduled run.

**If ALL THREE heartbeats alert at once, check the GitHub Actions budget
BEFORE debugging any job.** Independent jobs on three different schedules do
not fail simultaneously by chance, so a correlated miss means something
upstream of all of them, and the budget is the only thing upstream of all of
them.

The org Actions budget is **$20/month with "Stop usage when budget is reached"
ON** (set 2026-08-25, raised from the $0 that refused a scheduled run on
08-24). That is a hard cap: when it trips, every Actions run stops, heartbeats
included, and the symptom is three missed check-ins rather than a billing
message. Runway at the time of writing, repo is PRIVATE so minutes are billed:

- Team plan includes 3,000 min/month, $20 buys roughly 2,500 more at $0.008
  per Linux 2-core minute, so the ceiling is about 5,500.
- CI costs about 25 min per run (the SUM of the parallel jobs is what bills,
  not wall clock: e2e 710s, vitest 255s, build 112s, lint/format/typecheck/
  audit 72s, plus the rest).
- Scheduled jobs cost about 280 min/month, mostly synthetic checks every 6h.
- That leaves roughly 200 CI runs a month, about 7 pushes a day sustained.

Turning Stop usage OFF converts the cap into an alert and removes the failure
mode entirely, at the cost of an uncapped bill.

**Prove it works:** run `partitions.yml` manually (Actions tab, **Run
workflow**) and confirm the heartbeat registers as received. Then, if you want
the full test, wait out one grace period without running it and confirm you
get the alert.

---

### Task 5: Stripe dashboard notifications (5 min, free)

**Why:** Stripe sees failures our webhook never does, such as a card declined
before a session completes.

**Steps.** There is no "Notifications" page any more, verified 2026-08-25.
Stripe split it in two, and BOTH matter:

1. **Settings, Communication preferences** (under Personal settings), which is
   "the emails, SMS and push notifications YOU receive". Enable email for:
   - Failed payments
   - Disputes and chargebacks (redundant with our own operator alert,
     deliberately: disputes are the one event where two notifications beat
     zero)
   - Successful payments, optional, if you want a second source
2. **Settings, Team notifications** (under Account settings), which is "who on
   your team receives emails". This is per ACCOUNT, not per user, and Stripe
   routes some critical mail through it. Every personal preference can be on
   and a dispute still go to an address nobody reads if this points elsewhere.
   Confirm the recipient is a real inbox.

---

### Task 6: Turn on Vercel Log Drains (10 min, Pro feature you already have)

**Why:** confirmed 2026-08-24, the team scope `amira-salahs-projects` is on
**Pro**. That unlocks Log Drains, which is the single thing that closes the
"no log history" gap for the web side. On Hobby, runtime logs are effectively
unqueryable minutes after the fact; mid-incident that is exactly when you want
them.

**Steps**

1. Vercel, project **tensorcraft**, **Settings**, **Drains**.
2. Point it at a BetterStack Telemetry source (`telemetry.betterstack.com`,
   Sources, Connect source, Vercel).

**Done 2026-08-25, and the default the integration creates is wrong.**
Connecting BetterStack's Vercel integration authorises it at ACCOUNT level, so
it silently created one drain per Vercel project, 15 in total, each with
`sources: [static, lambda, build, edge, external]` and
`environments: [production, preview]`.

Two problems with that default:

- **`static` is roughly 95 percent of the volume and none of the signal.** It
  logs one line per asset request, so a single page view that pulls ~20 chunks
  produces ~20 static lines against ~1 lambda line. On a volume capped free
  tier that evicts the Function logs you actually want.
- **The other 14 projects share one quota.** Any traffic to an unrelated
  personal project competes with Tensorcraft's budget.

Neither UI can fix it: the integration owns the drain (`clientId: oac_...`) so
Vercel hands editing back to BetterStack, and BetterStack only shows the source
list. It has to be REPLACED. Create the correctly scoped drain FIRST, then
delete the integration one, so log delivery never gaps:

```
POST https://api.vercel.com/v1/log-drains?teamId=<team>
  { name, url: <same BetterStack url incl. token>, deliveryFormat: "ndjson",
    sources: ["lambda","edge","external"], environments: ["production"],
    projectIds: [<project>] }
DELETE https://api.vercel.com/v1/integrations/log-drains/<old id>?teamId=<team>
```

Current state: one drain on the project, `betterstack-production`, sources
`lambda`+`edge`+`external`, production only, `clientId: null` so it is
editable. `edge` is the one that matters most for us: middleware (auth
session refresh, world cookie) runs there.

**Cleaned up 2026-08-25:** the 14 drains for unrelated personal projects were
deleted via `DELETE /v1/integrations/log-drains/<id>`, leaving exactly one
drain on the account. They were competing for the same volume capped free tier.
Reconnecting the BetterStack Vercel integration would recreate all of them, so
do not reconnect it at account level; add the single project instead.

Note the dependency direction when tidying BetterStack: **Vercel drain feeds
BetterStack source**, so a source deleted while its drain still exists either
refuses to delete or comes back on the next event. Remove the drain first.
BetterStack's group level `...` menu greys out Rename and Remove because the
default group is not user created; individual sources delete from their own
settings page.

**Still open:** the BetterStack "Onboarding, Real-time flights" demo source,
which has no drain behind it and deletes normally from its own settings.
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

### PostHog (DONE 2026-08-26)

EU project live, events confirmed arriving. Five things that are easy to get
wrong, all hit on the way in or since:

1. **TWO variables are required, not one.** `apps/web/lib/posthog.ts:33-40`
   returns null and initialises nothing unless BOTH
   `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are set. An
   earlier version of this file named only the key.
2. **The host is the INGEST host, not the dashboard host.** EU is
   `https://eu.i.posthog.com`. `eu.posthog.com` is where you log in.
3. **Use the PROJECT API key (`phc_...`), never the project SECRET key
   (`phs_...`).** The `phc_` key is public by design and write only, which is
   why it is safe in a `NEXT_PUBLIC_` variable that ships to every visitor.
   A secret key grants scoped READ access to project data; putting it in a
   `NEXT_PUBLIC_` variable would publish that to everyone, and rotating it
   would need a rebuild rather than a dashboard change. Do not create a
   secret key at all.
4. **CSP.** `connect-src` and `script-src` now use `https://*.posthog.com`.
   CSP wildcards are a SUFFIX match on the whole host, so that one entry
   covers `eu.posthog.com`, `eu.i.posthog.com` and
   `eu-assets.i.posthog.com`. Contrast the Sentry line, `*.ingest.sentry.io`,
   whose suffix does NOT match `o123.ingest.de.sentry.io`, which is why that
   region host had to be added explicitly.
5. **The consent listener reacts to the consent key only (fixed
   2026-10-03).** `apps/web/lib/consent.ts` used to react to every
   `storage` event, and PostHog writes localStorage on each capture, so two
   open tabs re-ran each other's opt-in without end: 97% of all events were
   `$opt_in`, the client rate limiter dropped real events, and two tabs
   left open for about a day would use up the free plan's 1M monthly
   events (data is dropped above the cap). `$opt_in` showing up in volume
   means this regressed. Each hard load and each client-side navigation
   sends one `$pageview` (only a repeat of the last captured URL is
   skipped), and `$pageleave` is on (`capture_pageleave: true`). PostHog
   also starts opted out (`opt_out_capturing_by_default: true`), and
   sign-out re-applies the stored consent after `posthog.reset()`, which
   deletes the SDK's opt-out flag.

**Verifying: analytics is CONSENT GATED.** `initPostHog` runs only after the
visitor grants analytics consent, deliberately, because Sentry runs as
legitimate interest and product analytics does not. Zero events before
accepting the cookie banner is correct behaviour, not a broken setup. Accept
it, reload, then check Live: one `$pageview` per page load and no `$opt_in`,
even with two tabs open.

Full event checklist in `docs/analytics-verification.md`.

Deliberately last. This answers "what are people doing", not "what broke". It
matters less than the four above for launch week, and more than all of them by
week two.

## What still will not tell you anything

Being explicit so the list does not read as complete when it is not:

- **Upstash quota is still unmonitored.** August's near-miss was 490K of 500K
  commands. Checking it needs Upstash's management API credentials, which this
  repo does not hold, so it is a dashboard alert you set rather than something
  the repo can watch.
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
