# Consent and measurement release

November 11, 2026. Migration 067, API release 35, the web consent changes and
PostHog production configuration are live. Both Fly machines pass their health
checks. Eight live API consent checks pass. Production pages and their
JavaScript assets respond successfully. Full browser runtime checks and
consented server-event delivery remain unverified.

## Release source

The isolated release snapshot starts from commit `22cae183` and includes 47
explicit file overlays from the uncommitted workspace. The manifest records
each path, change status and file hash. It excludes the unrelated lesson-arrival
and evidence-link changes. No files were staged, committed or pushed.
[Source manifest](release/release-manifest.json).

## Production database

The migration completed at 11:01:47 UTC through the Supabase pooler with
verified TLS. Before application, the ledger contained 66 applied migrations,
and neither the consent table nor its write function existed. The ledger now
records version 67 as `analytics_consent`.
[Application evidence](release/migration-applied.json).

At 11:02:52 UTC, a separate read-only transaction passed all 15 catalog checks.
The checks verified column defaults, primary and foreign keys, the revision
constraint, row-level security, account-only reads and restricted write-function
access. The function body exactly matches the local migration. The connection
was encrypted and its certificate authorized. The new consent table was empty,
so the migration granted no account consent. Verification created no test
accounts or customer records.
[Catalog evidence](release/migration-catalog-verification.json).

## Production API

The isolated API release source passed 211 tests across nine files and its
typecheck under Node 26.10.0. The remote image build also passed typechecking.
The earlier default-Node test launch could not start because its runtime lacked
the installed dependency's required API. The successful run used the production
Node version.
[Source validation](release/api-validation.json),
[image build](release/api-image.json).

Fly release 34 deployed image
`sha256:1c6e3f4d503d21ebb8e02bf3c58d39e8ecf764c415ca73205572ebfd19e4e27f`
one machine at a time. At 11:06:58 UTC, both machines were started and passing.
The Fly hostname and `api.tensorcraft.app` both returned HTTP 200 for health
and HTTP 401 for anonymous consent requests. Consent responses carried
`Cache-Control: no-store`, and the CORS origin was `https://tensorcraft.app`.
PostHog remained disabled during these checks.
[Release checks](release/api-release-before-analytics.json).

At 11:07:25 UTC, hashes of five inspected source files matched the release
snapshot on both machines. This check used file hashes without starting another
SDK process.
[Deployed source checks](release/api-source-verification.json).

Eight HTTP checks passed from 11:08:47 to 11:08:55 UTC. They verified anonymous
GET and PUT rejection, missing-choice defaults, a fresh grant, stale-grant
conflict, withdrawal with a stale revision, rejection of a later stale grant
and the persisted withdrawal. Every response carried `Cache-Control: no-store`.
The temporary account required no confirmation email. Cleanup left no account,
profile or consent row for that test subject.
[Live API checks](release/live-api-consent-verification.json).

## Production web

Vercel promoted deployment `dpl_1CvKBkQAjGdw2LHaUGLcyK5rC3QT` at 11:08:19 UTC.
Its build and migration gate passed, and the production alias resolves to this
ready deployment. At 11:09:12 UTC, the public homepage, privacy page and sign-in
page returned HTTP 200. All 19 referenced JavaScript assets returned HTTP 200.
Their code contains the new consent version, account-save retry, durable
withdrawal handling, internal-traffic marker and production API endpoint.
[Build checks](release/vercel-build-summary.json),
[promotion](release/vercel-promotion-summary.json),
[production alias](release/vercel-production-alias-verification.json),
[public pages and assets](release/vercel-public-verification.json).

These web checks inspect HTTP responses and served code. The browser host was
unavailable, so they do not establish consent-banner interaction, browser SDK
capture, cross-tab behavior or failed-save recovery in a live browser. The
eight live API checks above exercise the API directly.

## PostHog production configuration

The deployment staged `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` at 11:09:34 UTC,
after the protected API, web release and live API consent checks passed.
A rolling update enabled them in release 35 using the same protected image.
At 11:11:00 UTC, both machines were started and passing health checks. Their
runtime token hashes matched project 257980, and both used the EU ingestion
host `https://eu.i.posthog.com`. Fly listed both settings as deployed. The
canonical API, custom API domain and privacy page returned HTTP 200.
[Staged configuration](release/analytics-config-staged.json),
[production configuration checks](release/analytics-production-verification.json).

Verification used shell checks and hashes without printing credentials or
starting another SDK process. Matching production configuration does not prove
event delivery. This release check triggered no payment, webhook replay or
GitHub action.

## Remaining release checks

- Verify fresh browser consent, failed-save handling and acknowledged withdrawal
  through the released user interface.
- Verify a consented server event through the running application, with internal
  marking where supported, and verify suppression after withdrawal.
- Mark owner browsers after the frontend release. Reconcile a naturally
  occurring consented settlement against Stripe and the purchase row.

The earlier production helper-check disruption and recovery remain in the
[measurement record](measurement-fix.md). Do not repeat a parallel SDK
bootstrap on the constrained Fly machines. The
[consent implementation record](server-consent-fix.md) preserves local test
results and the limits of withdrawal for events already queued or in flight.

This release verification does not establish payment-event ingestion, an
external conversion rate or complete revenue reporting. The historical browser
payment events remain unsuitable as transaction counts. Separate lesson-arrival
and evidence-link follow-ups remain pending.

If the API must return to the previous image, disable the PostHog settings
before that rollback because the old image does not check consent. Retain the
additive database migration during an application rollback. Its down migration
deletes stored choices and requires a separate deliberate decision.
