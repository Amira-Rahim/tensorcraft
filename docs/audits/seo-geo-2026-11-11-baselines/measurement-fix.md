# Analytics measurement repair

November 11, 2026. Live PostHog exclusions are active. The consent database
migration and protected API release 35 are live. The production PostHog settings
match the existing project and EU host on both machines. The web release is promoted,
public pages and assets pass HTTP checks, and eight live API consent checks
pass. Full browser runtime and live ingestion remain unverified in the
[deployment record](deployment.md). The original
[baseline](README.md) remains a dated observation, including unmarked internal
traffic and the historical browser payment events.

## Internal traffic

Project 257980 now excludes `tc_internal=true` events and localhost, loopback
and Vercel preview hosts by default. It retains the existing cohort 221371
exclusion. Negative conditions preserve server events with no browser host.
The cohort still contains zero people, so it cannot identify historical owner
traffic by itself.
[Previous settings](measurement/settings-before.json),
[current settings](measurement/settings-after.json).

The released [browser hook](../../../apps/web/lib/posthog.ts) labels each SDK
event with `tc_internal`, including anonymous activity. Its
[classification helper](../../../apps/web/lib/analytics-traffic.ts) treats
`tensorcraft.app` and `www.tensorcraft.app` as public hosts. Other hosts are
internal. This does not initialize analytics or bypass consent.

Open `https://tensorcraft.app/?tc_internal=1` once in each
browser used for owner testing, with analytics consent. The browser remembers
the marker across navigation and sign-out. Use `?tc_internal=0` to clear it.
The clear flag cannot make a development host public. A choice stays in memory
for the current page if browser storage is unavailable. Unmarked historical
owner visits remain unclassified.

A controlled `analytics_ingestion_check` event used the local API's configured
token and host, verified to match this project. It carries `tc_internal=true`
and `verificationOnly=true`. The query results are:

| Check | Recorded events |
| --- | --- |
| No internal filter | 1 |
| Project internal filter enabled | 0 |
| Host exclusion alone, with the diagnostic's host absent | 1 |
| Original production pageviews with the new project filters | 139 |

The first three results verify delivery and exclusion without dropping
hostless server data. The fourth preserves the original unmarked production
population. This diagnostic verifies the local API configuration and SDK path.
It does not verify Fly's production configuration or a payment webhook.
[Diagnostic](measurement/sdk-diagnostic.json),
[unfiltered](measurement/diagnostic-unfiltered.json),
[excluded](measurement/diagnostic-excluded.json),
[hostless check](measurement/diagnostic-hostless-retained.json),
[historical check](measurement/historical-filter-regression.json).

PostHog reports no active ingestion warnings. Absence of a warning cannot
establish that every intended event was sent.
[Health response](measurement/ingestion-health.json).

## Conversion events

The released [session listener](../../../apps/web/lib/supabase/session-listener.tsx)
no longer emits `signup_completed` on generic `SIGNED_IN` callbacks. Returning
sessions, tab focus and remounts therefore cannot count as new registrations
through this path. A verified account-creation signal remains
absent, so actual registrations remain unknown. Kit and identity behavior stay
independent.

The released receipt page no longer emits `payment_completed`. Stripe webhook
handlers supply version 2 settlement evidence: checkout ID, Stripe event and
payment-intent IDs, source, actual minor-unit amount, currency, live/test mode
and payment kind. Unknown values remain null. Zero charged amounts remain zero.
Credit-only upgrades emit `purchase_access_granted` separately.
[Webhook handlers](../../../apps/api/src/routes/payments.ts),
[server contract](../../../apps/api/src/lib/posthog.ts).

Cash reporting requires `eventSource=stripe_webhook`, `analyticsVersion=2`,
`livemode=true`, `paymentKind=cash`, a valid checkout ID, positive known amount
and known currency. Deduplicate by checkout ID, and group currencies separately.
Refund events carry checkout linkage, charge ID and cumulative
`amountRefundedMinor`. Never sum cumulative snapshots for the same charge.
Reconcile refunds against Stripe before reporting net revenue.

The API logs SDK delivery/capture failures without event payloads or
credentials. Graceful shutdown awaits SDK flushing within the existing
ten-second shutdown limit. Delivery remains best effort. Existing purchase and
event-ledger deduplication can prevent replay after delivery loss, so it does
not guarantee complete analytics.
[Internal-filter guidance](https://posthog.com/docs/data/test-accounts),
[Node SDK guidance](https://posthog.com/docs/libraries/node#capturing-events).

## Payment record reconciliation

A read-only query of the live Stripe account confirmed its Tensorcraft domain.
For checkouts created October 12 through November 8, in UTC, it found one
completed paid checkout for 5,000 USD minor units ($50). The exact checkout ID
matches one completed Supabase purchase row with the same amount. The query
exhausted its result page. No customer identifiers appear in the saved record.
[Stripe cohort](measurement/stripe-checkout-cohort.json),
[purchase reconciliation](measurement/stripe-db-reconciliation.json).

This establishes one paid checkout in that creation cohort. It does not measure
settlement-date revenue, exclude owner purchases, attribute a source or provide
a consented visitor-to-purchase rate. The two historical browser payment events
remain unsuitable as a transaction count. No purchase, refund or Stripe webhook
replay occurred during verification.

## Validation and release limits

The combined focused run passed 188 tests across 11 files. Web and API
typechecks passed. The production web build generated 104 pages. Targeted lint
passed with no new errors. Independent review found no concrete defects.
The build retained existing cache-header and Next.js deprecation warnings.

The deployment guide now names `POSTHOG_PROJECT_TOKEN`, matching the API,
and uses the project's EU ingestion host. API startup warns when either
PostHog setting is missing. The initial Fly CLI check lacked an access token.
A later browser login completed successfully, and `fly auth whoami` now
succeeds. Fly's login flow updated its CLI from 0.4.104 to 0.5.7.

The first account had no app access. Switching to the owning account resolved
that block. The initial SSH inspection found both production machines running
the same older image without `POSTHOG_PROJECT_TOKEN` or `POSTHOG_HOST`.
Its helper returns null when either setting is absent. Both machines also
lacked the version 2 payment evidence, delivery-error logs and shutdown flush
changes at that inspection.
[Initial access attempt](measurement/production-access.json),
[production runtime evidence](measurement/production-runtime.json).

Enabling the secrets required a coordinated release. The existing
[server-consent backlog item](../../post-launch-backlog.md#posthog-data-audit-follow-ups-2026-10-03)
remains open for final release verification. The original deployed captures
checked configuration but did not check analytics consent. Adding secrets to
that image would have activated those paths. The subsequent
[consent repair](server-consent-fix.md)
adds stored choices and withdrawal, checks current consent before server
capture and disables server exception autocapture. Migration 067 and the
protected application release preceded PostHog enablement. Migration
067 completed at 11:01:47 UTC, and all 15 production catalog checks pass.
Protected API release 34 passed source-hash and health checks on both machines.
The web release is promoted and its public pages
and assets pass HTTP checks. Eight live API checks verify grants, conflicts and
withdrawal. Release 35 enabled the existing project's token and EU host using
the same protected image. At 11:11:00 UTC, both machines had matching runtime
settings and passing health checks. Configuration verification used shell
checks and hashes without starting another SDK process.

Follow-up helper inspection coincided with failed health checks on both
machines. Stopping the temporary helper restored one machine. The other
remained unresponsive to process cleanup and required a restart. The restart
completed with its health check passing. The timing supports temporary helper
contention, but the available logs do not establish an out-of-memory event.
The runtime evidence records the incident and final health checks. Future
ingestion checks must account for the machines' 256 MB memory limit and avoid
another parallel SDK bootstrap. That inspection created no analytics diagnostic
event, secret change, code deploy, transaction or webhook replay.

Complete browser runtime verification and verify consented server-event delivery
through the running application with adequate resource headroom.
Mark owner browsers and inspect a real settled payment's version 2 event in
PostHog, reconciling it to Stripe and the
purchase row. Keep checkout-source reporting disabled. The canonical backlog
retains those remaining release and ingestion-verification gates.
