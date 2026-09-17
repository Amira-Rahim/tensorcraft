# Launch verification

Updated on 2026-09-17. The four requested implementation checks pass:
spaced review, PostgreSQL row security, browser E2E, and real signup plus
Stripe test checkout. GitHub callback configuration, a production signup
inbox check, and the paid snapshot drill still need owner input. Stripe Tax
and business registration are deferred at the owner's request. The earlier
fixes were committed and pushed as `7acc978b`; all CI jobs passed.

## Recorded results

Validation used a clean installation of the locked dependencies, including
Next.js 16.3.5 and React 19.3.0.

- Final full unit suite: 2,666 passed, 65 skipped.
- Full Playwright pass from the preceding implementation work: 137 passed,
  34 skipped. Includes desktop, iPhone, Pixel, iPad, accessibility, guest
  review scheduling, scene playback, and reading without JavaScript.
- Seeded warm-up visual comparisons: 2 passed against inspected light/dark
  baselines. The broader opt-in visual suite was not run.
- Real PostgreSQL RLS assertions passed again after these fixes.
- Lint, typecheck, formatting of changed code, and diff whitespace checks
  passed. Existing lint warnings remain.
- Local production web build and production API Docker build passed.
- The built API container passed health, database readiness, account export,
  and signed dispute/replay checks against real local Supabase.

The real browser integration described below ran separately from the mocked
Playwright suite. No live payment was made.

## Spaced review

The lesson reader now enqueues authored recall prompts on completion, shows up
to two due prompts before the next Briefing, and defers scene playback until
the warm-up finishes. A learner must type an attempt or choose "I couldn't
recall it" before seeing the answer. Typed text is never stored or transmitted.

Guest schedules stay in localStorage and merge on signup without overwriting
an existing server schedule. Signed-in writes use the review API. Failed writes
are retried from an account-scoped local outbox; failed retries report to
Sentry. Review retries compare the displayed schedule version to avoid counting
an answer twice after a lost response. Paid prompt resolution retains the
entitlement check, including on free lesson pages after a refund.

Production migration status was checked on 2026-09-16: all 61 migrations,
including the review queue, are applied. The updated API was deployed before
the web changes. No hosted migration was applied during this pass.

## PostgreSQL policy tests

Run `pnpm test:rls`. PostgreSQL 16+ is required; `PG_BIN` can point to its binary
directory. The command creates a temporary cluster with only a Unix socket,
loads platform auth/storage contracts and application migrations, runs SQL
assertions, stops PostgreSQL, and deletes the cluster. It ignores `DATABASE_URL`
and connection service overrides. CI runs the same command.

The assertions exercise anonymous access, two authenticated learners, the
service role, profile creation on signup, progress and review isolation,
purchase and arena write denial, role/billing clamps, review conflict handling,
and the progress summary view. These are real PostgreSQL policies and triggers,
not mocked query filtering. They do not test the hosted Supabase Auth server,
PostgREST JWT verification, email delivery, or project configuration.

Migrations 027 and 028 are explicitly skipped: 027 contains a non-immutable
`now()` index predicate that PostgreSQL rejects, and both features were removed
by 033. All remaining up migrations, including the replacement 061 queue, run
unchanged. This harness verifies current policies; it is not a claim that the
entire historical migration chain replays without exceptions.

## Browser verification

Use the locked dependency installation and matching Playwright browsers:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

The added guest test completes a lesson, advances the browser clock, answers
the next-day warm-up, and verifies the updated schedule. Seeded light and dark
axe tests inspect both the question and revealed answer. The visual test has
an explicit due-queue fixture so it cannot pass on an empty page. The lesson
reader is rendered outside a streamed Suspense boundary, and the no-JavaScript
fallback reveals both the Briefing and teaching prose. A browser test exercises
that fallback with JavaScript disabled.

## Real signup and Stripe test checkout

An isolated local Supabase stack ran Auth, PostgREST, PostgreSQL, and Mailpit.
Application migrations were applied with the same retired-migration exclusions
as the RLS tests. The custom access-token hook was enabled to match production.
The web app ran as a production build on localhost:3100 and the API on :3101.
External email, analytics, and Sentry delivery were disabled in this test setup.
The local servers, Stripe listener, Supabase stack, and test VM were stopped
after verification. Local Supabase test data is retained for a later restart;
one unused test Checkout Session was expired.

The browser completed these checks against real services:

1. Request a magic link and receive it in Mailpit.
2. Follow the email link through the PKCE callback into onboarding.
3. Save experience level, years, JavaScript background, and learning goal.
4. Migrate guest lesson completion and the existing review schedule into
   PostgreSQL. Confirm the refreshed JWT includes completed onboarding.
5. Export account data through the authenticated API, including review history.
6. Start checkout through the application and reach hosted Stripe Checkout.
7. Pay USD 50 with Stripe's 4242 test card and return to the purchase-success
   page. Stripe confirmed `livemode: false` and `payment_status: paid`.
8. Receive Stripe's signed completion event through the CLI, record the
   purchase, grant Deep Orbit, and show ownership in the browser.
9. Replay the completion event twice. Exactly one purchase and one completion
   event record remained. An invalid signature returned HTTP 400.

Two Stripe test payments completed during the run, including one with the
production-equivalent access-token hook enabled. No real money moved. Local
signed dispute fixtures separately checked access removal, restoration after
winning, and replay of the same won event against the real database.
An authenticated review attempt also persisted its next schedule through the
built API container; retrying the same request did not increment it twice.

The ignored `apps/api/.env.checkout-test.local` contains local Supabase and
Stripe test settings. CLI test credentials may expire. Do not use production
Supabase or a live Stripe key for these browser tests. The test mailbox captures
email locally; this does not certify production email delivery.

## Fixes found by verification

- Local signup failed because CSP excluded configured backend ports. The web
  CSP now includes exact configured API and Supabase origins, validates their
  schemes, and adds the matching Supabase WebSocket origin.
- Account exports omitted review schedules. `review_queue` is now included.
- Replaying a won dispute returned HTTP 500 after access was already restored.
  Already-settled purchases now acknowledge that replay with HTTP 200; missing
  or unresolved purchases still return a retryable error.
- The production API Docker build called Corepack, which Node 26 does not
  include. It now installs the exact repository pnpm version and includes the
  required config workspace manifest. Recursive Docker exclusions keep host
  dependencies, build output, and local environment files out of the image.
  CI now builds the production API image as a separate check.
- Handled API errors could return HTTP 500 without reaching Sentry. They now
  report an error and include the `source` tag used by payment/GitHub alerts.
  Exceptions already captured by the error handler are not reported twice.
- The live Stripe webhook omitted `charge.dispute.closed`. That subscription
  was added and read back. Existing endpoint URL, API version, and events were
  preserved.
- Fly lacked GitHub client credentials and its API callback URL. The existing
  App credentials were verified and installed. Registration of the callback
  still needs correction in GitHub, as described below.
- GitHub connect omitted `credentials: "include"`, preventing the browser
  from storing the API's OAuth state cookie across origins. The request now
  includes credentials. Successful browser callbacks return to Settings;
  programmatic callers retain the JSON response. Regression checks reproduced
  both defects before the fix and pass afterward, including cookie validation,
  credentialed CORS, token persistence, and the final redirect.

## Deployment

Production database migration status is 61/61 in sync. Fly's required-secret
preflight passed before deployment. The previous API image was from August;
both machines now run release 25 and pass health checks. Database readiness
also returns HTTP 200. Authentication and CORS smoke checks use public routes
without creating production users or purchases.

- API image: `registry.fly.io/tensorcraft-api:deployment-01M2NZNJHQ4PV10FNBFJ40SF8B`.
- Previous image, retained for rollback:
  `registry.fly.io/tensorcraft-api:deployment-01M0R0NYQW92Z6EZWRVGS4G4CT`.
- The attempted GitHub Actions deployment failed before rollout because of
  the Dockerfile issue. The corrected working tree was deployed directly
  through Fly after local checks, without committing or pushing.
- Web: [deployment dpl_2NshahgKULt713q9ZmPhdu1tJ4i3](https://vercel.com/amira-salahs-projects/tensorcraft/2NshahgKULt713q9ZmPhdu1tJ4i3)
  built successfully and was promoted to `tensorcraft.app`. Home, pricing,
  and auth return HTTP 200. The deployed pricing page renders its free and
  paid controls in the browser. The deployed CSP contains production backends
  and excludes the local test ports.

## Monitoring and recovery

UptimeRobot shows six active monitors, all up: API root, health, database
readiness, web root, blog, and pricing. Sentry has web/API error monitors and
scheduled-job checks. The enabled payment alert filters `source` for payments
and notifies project members. The handled-error tests verify that failures
carry that tag. On 2026-09-17, both production alert delivery paths passed:

- `sendOperatorAlert` sent a clearly labeled test through the configured
  production Resend account to the existing operator recipient. Resend
  recorded delivery, and the message appeared in the recipient's Gmail inbox.
- A synthetic Sentry event with `source=payments.launch_verification` fired
  the enabled payment alert at 07:38 UTC. Its notification appeared in the
  configured Sentry owner's Gmail inbox. The event contains no customer data:
  [test issue TENSORCRAFT-API-2](https://amira-salah.sentry.io/issues/147594211/).
  The synthetic issue was marked resolved after delivery verification.

The SDK delivery checks ran locally with protected temporary copies of the
production alert settings. An earlier diagnostic process stalled on a Fly
machine and was stopped. API health and database readiness then returned 200.
No production transaction was failed to create the test event.

Supabase shows daily managed backups, including the 2026-09-16 snapshot.
PITR is not enabled. A fresh read-only logical export of `public`, `auth`, and
`storage` was restored into an isolated local database. All 69 tables matched
source row counts and sorted-content fingerprints; 34 public RLS policies
were present. The temporary database and export were removed afterward.

The logical drill does not restore a managed physical snapshot. The latest
managed backup was completed on 2026-09-17 at 05:55:15 UTC. Restoring it to a
separate project is prepared in the dashboard, which quotes USD 0.50/month.
Approval to create and remove that test project is pending. Production has no
`pg_cron`, `pg_net`, or `wrappers` extension installed, so no copied external
jobs were found in the pre-restore check.

Storage byte recovery was tested separately on 2026-09-17. Both production
buckets were inventoried; the two avatar objects total 21,144 bytes. Each was
downloaded to a private temporary backup, restored into a new private local
bucket, and downloaded again. SHA-256 hashes and content types matched. The
source object inventory stayed unchanged, and all local drill buckets and
temporary files were removed. This is a recovery drill, not a retained
off-site Storage backup.

Repeat the Storage drill with local Supabase running:

```sh
node --env-file=apps/api/.env scripts/verify-storage-restore.mjs \
  --local-env-file apps/api/.env.checkout-test.local
```

The script rejects hosted restore destinations before any network or disk
writes. It reads the source, creates unique private local buckets, verifies
restored bytes, and cleans up. Supabase's managed database backups do not
include Storage file bytes; see the
[backup documentation](https://supabase.com/docs/guides/platform/backups).

## Remaining external configuration

### GitHub connection

The App identity and existing client credentials were checked with GitHub.
Fly now has `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
`GITHUB_CALLBACK_URL`, and the existing `GITHUB_TOKEN_ENC_KEY`.
However, GitHub rejects this required callback as unregistered:

`https://api.tensorcraft.app/api/github/callback`

[App settings](https://github.com/settings/apps/tensorcraft-exercises) are now
accessible after the owner's passkey check. The exact callback is entered with
wildcard matching disabled, ready to save after the required confirmation.
Existing URLs are preserved. A real connection and exercise save still need an
authorized test account. The live OAuth round trip is not yet verified.

### Stripe Tax and invoices (deferred)

The owner excluded Stripe Tax and business registration from this work on
2026-09-17. Their configuration remains unchanged, and tax/invoice verification
is not claimed as complete.

Read-only Stripe checks show live Tax settings pending because the business
origin address (`head_office`) is missing, with no tax registrations listed.
`STRIPE_TAX_ENABLED` is not set in Fly. When this work resumes, supply the
actual business origin and applicable registration details in Stripe. Enable
the flag and
verify tax calculation plus invoice creation in test mode.
No business address or tax registration was invented, and no live charge was
used for verification. The successful USD 50 checkout test above ran with
Stripe Tax disabled.

## Repository checks on 2026-09-17

The previous fixes are in commit `7acc978b05f1ebb44614006bf3c7dddb8a7f4398`.
[CI run 35194298998](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35194298998)
passed all ten jobs, including the new API image build, database row security,
full browser suite, unit tests, dependency audit, and migration ledger check.
Visual regression also passed.

Storage recovery and alert delivery evidence were pushed in `9317c950`.
[CI run 35196051553](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35196051553)
passed all ten jobs, and visual regression passed. Subsequent GitHub browser
flow fixes add a regression test to the existing route and settings checks.
