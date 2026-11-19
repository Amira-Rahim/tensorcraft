# Server analytics consent repair

November 11, 2026. Migration 067 is applied in production and all 15 catalog
checks pass. Protected API release 35 is deployed and both machines pass health
checks. The web release is promoted, and eight live API consent checks pass.
PostHog settings match the expected project and EU host on both machines.
Full browser runtime and server-event delivery remain unverified. The
[deployment record](deployment.md) tracks production evidence separately from
the local implementation checks below.

## Consent scope

Browser analytics requires a fresh version 2 choice. Earlier cookie choices
cannot silently enable the new account-level server analytics scope. A signed-in
choice also controls PostHog purchase and code-export events for that account.
Missing consent remains off. The browser never enables analytics just because
the account has a saved grant.

Account withdrawals affect future server captures across devices. The browser
stops its own capture immediately and displays pending or failed account saves.
An offline withdrawal reaches the account when synchronization succeeds.
Other browsers reconcile account changes when they regain focus or reconnect.
Events already queued or in flight cannot be recalled by a later withdrawal.

## Stored choices and conflicting requests

[Migration 067](../../../packages/supabase/migrations/067_analytics_consent.sql)
adds `analytics_consents`. Existing accounts receive no grant. Authenticated
users can read only their own row. The write RPC derives the account from the
authenticated token, and ordinary clients cannot update the table directly.
Account deletion cascades to the consent row, and account exports include it.

Each choice advances a revision. Grants must match the previously observed
revision. Withdrawals advance it even if their request used an older revision.
This prevents an earlier acceptance from replacing a later withdrawal.
The authenticated [API](../../../apps/api/src/routes/analytics-consent.ts)
returns uncached state and rejects stale grants with HTTP 409.

The browser discards stale grants instead of retrying them against a newer
revision. It can associate a fresh anonymous acceptance only with an account
that has no consent history. An existing account requires a fresh signed-in
choice. Pending withdrawals remain associated with the original account.

## Event capture

The [server helper](../../../apps/api/src/lib/posthog.ts) checks current stored
consent immediately before queuing an event. It does not cache grants or trust
checkout metadata. Missing rows, denied choices and failed lookups skip capture.
A one-second lookup deadline bounds the extra wait. All seven payment and
GitHub callers await the helper, which contains lookup and SDK errors so they
cannot fail fulfillment.

PostHog server exception autocapture is disabled. Auth middleware no longer
initializes PostHog or creates its user context. Sentry remains the separate
operational error monitor. PostHog documents exception autocapture as a
process-level listener for uncaught exceptions and unhandled rejections.
[Node error tracking documentation](https://posthog.com/docs/error-tracking/installation/node).

## Release dependencies

Migration 067, the API changes, and the browser consent flow form one release.
The migration completed at 11:01:47 UTC, and independent catalog verification
passed at 11:02:52 UTC. Protected API release 34 passed health, anonymous-access
and source-hash checks on both machines. The web release is promoted and its
public pages and assets pass HTTP checks. Eight live API checks verify grants,
stale-request conflicts and withdrawal. Release 35 enables the existing
PostHog project token and EU host on the same protected image. Runtime checks
confirm both values match on both machines, with health checks passing.
The original inspection and
subsequent recovery remain recorded in the [measurement repair](measurement-fix.md).

Verify a fresh grant and an acknowledged withdrawal through the released
browser interface. Check a consented server event in PostHog and confirm
that a later event after withdrawal is absent while the underlying action still
succeeds. Do not bootstrap another parallel SDK process on the constrained Fly
machines. Use the running application and preserve the production health checks.

Payment reporting still requires version 2 settlement evidence and Stripe
reconciliation. Consent makes the observed event population incomplete by
design, so PostHog event totals cannot replace the payment ledger.

## Validation

Across focused batches, 281 tests passed in 18 files: 211 API, payment, GitHub,
authentication and export tests, plus 70 browser tests. The browser regressions
cover stale responses, account changes, failed saves, blocked storage and
withdrawal after an uncertain grant. Payment tests use the actual consent guard
with mocked outbound services and verify successful fulfillment without capture.

The isolated PostgreSQL harness passed permissions, own-row visibility,
concurrent first choices, stale revisions, account erasure, repeated migration
application and rollback checks. API and web typechecks passed. Targeted lint
and whitespace checks passed. The production web build generated 104 pages.
It retained the existing cache-header, middleware and Edge Runtime warnings.
Stale local development route types were regenerated from the installed Next.js
tools, and the tracked `next-env.d.ts` remains unchanged.

These implementation checks ran locally before the production migration.
Migration application and its read-only verification are recorded separately
in the [deployment record](deployment.md). The isolated API release also passed
211 tests and typechecking before deployment. Production HTTP and served-code
checks pass. Full browser runtime and live server capture remain unverified.
