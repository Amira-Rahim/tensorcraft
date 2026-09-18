# Launch verification

Updated on 2026-09-18. The four requested implementation checks pass:
spaced review, PostgreSQL row security, browser E2E, and real signup plus
Stripe test checkout. GitHub callback and permission configuration, production
alert delivery, the managed snapshot restore drill, production email sign-in,
and GitHub authorization are complete. Manual and automatic GitHub exercise
saves are verified with App access restricted to the exercise repository.
Real Stripe test refunds and support mailbox settings also pass. Private
repository creation is verified using the existing account and restricted App
installation; a separate account was not required.
Stripe Tax and business registration are deferred at the owner's request.
The recorded CI run for `840a1d05` passed all ten jobs.

The later project-export patch is also deployed to Fly and Vercel as of
2026-09-17 at 21:23 UTC. Health, database readiness, public browser checks,
authentication rejection and the exact project download pass. Successful
publication through the new authenticated endpoint and reproduction from a
clean GitHub clone passed on 2026-09-18 after the owner reconnected GitHub.
The 2026-09-18 diagnosis found a browser connection failure and a separate
headless Chrome instance, not evidence that the owner was signed out. The
subsequent authorized API check reached GitHub but the saved token was rejected.
The missing token-renewal implementation is repaired and deployed as Fly
release 32 and Vercel `dpl_3bJw26RAycdLk28JzSv8VekS86cY`; 121 targeted tests
pass. The live check published 26 files, reused the same commit on retry,
preserved all three existing files and reproduced validation/test results.
The cloned app also passed Chromium prediction checks. Production folder-picker
interaction and a live automatic token-renewal cycle remain unverified.
See the [live export results](audits/project-export-live-2026-09-18.md) and
[renewal repair](audits/github-token-renewal-2026-09-18.md). Independent
reviewer candidates and a frozen handoff are prepared; no reviewer has been
appointed. See the [deployment record](audits/project-export-deployment-2026-09-17.md).

## Recorded results

Validation used a clean installation of the locked dependencies, including
Next.js 16.3.5 and React 19.3.0.

- Prior full unit suite: 2,669 passed, 65 skipped.
- Refund fixes: 76 focused payment, signed-webhook integration, and operator
  alert tests passed. API typecheck and lint passed with seven existing warnings.
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

### Real Stripe test refunds, 2026-09-17

The retained local stack was restarted for refund verification. Stripe test
payment `pi_3UGPZSAbX1OG1Kid00GjxLWD` had a completed USD 50 purchase and
Deep Orbit access before the check. Actual Stripe test refunds then passed:

- USD 10 partial refund `re_3UGPZSAbX1OG1Kid0ncoH9I0`: the Stripe CLI
  delivered the signed event, the purchase became `partially_refunded`, and
  authenticated access still included Deep Orbit.
- Remaining USD 40 refund `re_3UGPZSAbX1OG1Kid03LQ7gsi`: the signed event
  changed the purchase to `refunded`, and authenticated access became empty.
- Replaying full-refund event `evt_3UGPZSAbX1OG1Kid00TCatsb` twice kept
  one event-ledger row and left access revoked.
- Replaying the earlier real partial-refund event after the full refund
  returned HTTP 200 without restoring access or changing `refunded` status.

The last two checks used the actual Stripe event payloads with locally signed
test headers against the current API and real local PostgreSQL. External
notifications were disabled locally; the concurrent-delivery regression test
separately verifies one analytics event and one operator alert per event ID.
No live charge or refund was made.

Read-only production checks found charges and payouts enabled and an active
webhook at `https://api.tensorcraft.app/api/payments/webhook`. Its event list
includes checkout completion, delayed payment success/failure, refunds, and
both dispute events. This verifies configuration, not a live transaction.
[Stripe's testing documentation](https://docs.stripe.com/testing) prohibits
using real payment details for live-mode testing. Observe the first genuine
customer purchase during normal operation rather than making a test purchase
with a personal card.

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
  App credentials were verified and installed. The owner subsequently saved
  the required callback and repository Administration permission in GitHub.
- GitHub connect omitted `credentials: "include"`, preventing the browser
  from storing the API's OAuth state cookie across origins. The request now
  includes credentials. Successful browser callbacks return to Settings;
  programmatic callers retain the JSON response. Regression checks reproduced
  both defects before the fix and pass afterward, including cookie validation,
  credentialed CORS, token persistence, and the final redirect.
- After analytics consent, PostHog adds session, window, and distinct-ID tracing
  headers to API requests. The API's CORS allowlist omitted all three, preventing
  browsers from sending those requests. The allowlist now includes those exact
  headers. A regression test failed before the change and passes afterward;
  another test confirms untrusted origins remain denied. The production
  preflight response reproduced the missing headers before deployment.
- Fly's `APP_URL` still pointed to the retired `https://tensorcraft.dev` domain.
  A successful GitHub authorization saved the connection but redirected to that
  unreachable host. The runtime value was corrected to `https://tensorcraft.app`
  and read back after rollout. Checkout return URLs and transactional-email
  links use the same setting.
- Duplicate refund deliveries repeated analytics and operator alerts. Refund
  notifications now use the existing unique event ledger after the purchase
  update succeeds. Missing purchases still return a retryable error.
- A delayed partial-refund event could overwrite a full refund, dispute, or
  failed purchase and restore paid access. An atomic database status filter
  now prevents that update. Three signed-webhook regression cases reproduced
  the defect before the fix; a real Stripe event replay also passed afterward.

## Deployment

Production database migration status is 61/61 in sync. Fly's required-secret
preflight passed before deployment. The previous API image was from August;
the initial rollout put both machines on release 25 with passing health checks.
Database readiness also returned HTTP 200. Authentication and CORS smoke checks
use public routes without creating production users or purchases.

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

The later GitHub browser-flow fix is commit `9590b02e`.
[API deployment 35196890632](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35196890632)
passed its migration and secret gates, then deployed release 26 to both
machines. Both report passing health checks and the expected commit SHA.
Public health and database readiness checks returned HTTP 200 afterward.
The [Vercel deployment](https://vercel.com/amira-salahs-projects/tensorcraft/E44biWs9MNcgobg1G8NCtw9BwiJ9)
is Ready and serves `tensorcraft.app`.

The analytics-header CORS fix is commit `5a68da4b`.
[API deployment 35207573733](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35207573733)
passed and deployed release 27. The production preflight then allowed all three
PostHog headers, along with Authorization and Content-Type. Correcting `APP_URL`
rolled both machines to release 28 using the same image. Both health checks
passed, and public health plus database readiness returned HTTP 200.

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

A separate managed physical snapshot drill passed on 2026-09-17. After owner
approval, the 05:55:15 UTC backup was restored into a temporary project. The
restored project reached Active Healthy. All 69 tables matched production row
counts and sorted-content fingerprints. Column definitions, RLS settings,
34 public policies, and the 61 applied migrations also matched. The temporary
project was deleted after verification; the project list confirmed its removal
and production remained Active Healthy. Production has no `pg_cron`, `pg_net`,
or `wrappers` extension installed, so no copied external jobs were found in the
pre-restore check.

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

## External configuration and remaining verification

### GitHub connection

The App identity and existing client credentials were checked with GitHub.
Fly now has `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
`GITHUB_CALLBACK_URL`, and the existing `GITHUB_TOKEN_ENC_KEY`.
The owner saved this exact production callback on 2026-09-17:

`https://api.tensorcraft.app/api/github/callback`

[App settings](https://github.com/settings/apps/tensorcraft-exercises) confirm
the saved callback with wildcard matching disabled. Existing callback URLs
were preserved. The initial browser block and tracing-header CORS defect were
resolved. The owner completed GitHub authorization, and Settings showed
`CONNECTED` as `amirasalah`. A read-only database check confirmed the saved
connection. The stale `APP_URL` found during that round trip was corrected as
described above.

The production Introduction to Tensors exercise passed all eight tests, and
the lesson reached its final step. A read-only database check confirmed two
passing attempts and one completed lesson. The earlier TensorFlow.js loading
failure did not recur in this run; its original cause remains unconfirmed.

The first automatic GitHub save returned 403, "Resource not accessible by
integration". Account authorization had succeeded, but the App was not
installed. The owner approved access only to `tensorcraft-deep-orbit`. An
initial public repository was created through the owner's GitHub CLI, then
App installation `162451914` was completed with only that repository selected.
Automatic repository creation was not exercised in that initial check; the
later restricted-installation test below verifies it.

Settings' **Push solved exercises** then reported
`Pushed 1 · skipped 0 · failed 0`. The
[exercise commit](https://github.com/amirasalah/tensorcraft-deep-orbit/commit/80dc7fa6b86d15ff733c1006b2d76fff8c7b5c0d)
contains the exact passing solution at `foundations/create-a-tensor.ts`; the
[progress commit](https://github.com/amirasalah/tensorcraft-deep-orbit/commit/9d06dbb4a930eb0fcfd02676ab9ca8c6b1d15d57)
records the lesson. The exercise file was written by Tensorcraft's real push
flow. Settings became responsive after releasing a stalled browser debugger
and reloading; no browser security settings were changed.

Automatic saving was then verified independently. On the production exercise,
the passing solution was changed to use
`tf.tensor(streamValues, [streamValues.length])`. Clicking **Run tests** passed
all eight checks and automatically created
[commit cbca8764](https://github.com/amirasalah/tensorcraft-deep-orbit/commit/cbca8764aab47c00f3f08d0b6b7c351148c9cc0c).
GitHub's API confirmed the exact change in `foundations/create-a-tensor.ts`.
The Settings backfill action was not used in this check. The owner's
restricted installation was preserved.

Repository creation was verified separately on 2026-09-17 using the existing
App user token and the actual `createOrGetRepo`, `pushFile`, and `getFile`
helpers. Source hashes matched the deployed helpers before the test. The
checks ran locally because one-off diagnostic processes on Fly timed out
reaching Supabase and GitHub. The credential was decrypted on Fly, passed to
the local verification process in memory, and never saved as plaintext.

- GitHub returned HTTP 201 for the new private repository
  [`amirasalah/tensorcraft-verification-20260917`](https://github.com/amirasalah/tensorcraft-verification-20260917),
  ID `1374429729`.
- The App remained on `repository_selection: selected`. GitHub automatically
  added the new repository; the selected list contained only it and the
  existing exercise repository. No all-repository access was granted.
- The file helper committed harmless text to `verification.txt`, and read-back
  matched its contents exactly:
  [commit a9a4c426](https://github.com/amirasalah/tensorcraft-verification-20260917/commit/a9a4c4267344b15cb9793cac641895adf599f57c).
- Repeating creation returned HTTP 422 from GitHub, and the helper correctly
  fetched the same repository ID. No second repository or commit was created.
- The existing exercise repository's branch head stayed unchanged.

The private test repository is retained for inspection. This closes the real
repository-creation check without a separate account. It does not claim a
fresh-account browser onboarding test was performed. The earlier statement
that a separate account was required was incorrect.

Settings now explains the separate App installation, links to its installation
screen, and describes the single-repository setup. The API access error points
to that recovery path. The three focused suites pass all 51 tests, and both
web and API type checks pass.

The App now has `administration: write`, `contents: write`, and `metadata: read`,
confirmed after the owner's approval. GitHub requires `administration: write` for the
[`POST /user/repos` endpoint](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user)
used to create exercise repositories. This permission also covers repository
settings and deletion within the App's authorized access. Existing installations
must accept the added permission before it takes effect for them.

### Production email sign-in

The owner completed magic-link sign-in using the supplied test mailbox on
2026-09-17. The mailbox tab displayed the received "Your Magic Link" message;
the authenticated dashboard and Settings both showed the expected email
identity. The owner handled the email-link step after browser-control
interruptions. This verifies production email sign-in, without claiming a new
account was created during this check.

### Support mailbox

The receiving Gmail account's settings were inspected on 2026-09-17. They
already contain all three previously open items, so no settings were changed:

- A `to:(support@tensorcraft.app)` filter applies the `Tensorcraft` label and
  **Never send it to Spam**.
- `support@tensorcraft.app` is the default send-as address, with **Always reply
  from default address** selected.
- The sender name is `Tensorcraft`; Gmail sends through `smtp.resend.com`
  using TLS on port 587.

The personal receiving address is intentionally omitted from this public
record. Prior inbound and outgoing delivery evidence remains recorded in
the post-launch backlog; no new support email was sent during this check.

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
The three targeted GitHub/settings suites passed 51 tests, and the pre-push
full suite passed 2,667 tests with 65 skipped. Both new regressions failed
before the implementation change and passed afterward. CI for the code fix,
[run 35196881623](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35196881623),
passed. The latest pushed record, `33c0fa7a`, also passed all ten jobs in
[run 35197315060](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35197315060)
and [visual regression](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35197315075).

The CORS fix added two policy regression tests. All 56 targeted CORS, GitHub,
and Settings tests passed; the full pre-push suite passed 2,669 tests with 65
skipped. API lint and typecheck passed with existing lint warnings.
[CI run 35207560199](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35207560199)
passed all ten jobs, and
[visual regression 35207560245](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35207560245)
passed.

The GitHub installation guidance in `840a1d05` passed all ten jobs in
[CI run 35213709940](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35213709940),
[visual regression 35213709950](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35213709950),
and [API deployment 35213719374](https://github.com/Amira-Rahim/tensorcraft/actions/runs/35213719374).
