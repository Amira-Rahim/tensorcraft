# Launch verification

Local implementation and verification pass, 2026-09-16. Changes are not deployed.

## Recorded results

Validation used a clean installation of the locked dependencies, including
Next.js 16.3.5 and React 19.3.0. The existing workspace dependency directory was
not used to certify the production build.

- Full unit suite: 2,648 passed, 65 skipped. Two final regression cases were
  added afterward; their complete suites also passed (9 outbox cases and 14
  server resolution cases).
- Final full Playwright run: 137 passed, 34 skipped. Includes desktop, iPhone,
  Pixel, iPad, dual-scheme accessibility, guest review scheduling, scene
  playback, and reading with JavaScript disabled.
- Seeded warm-up visual comparisons: 2 passed against inspected light/dark
  baselines. The broader opt-in visual suite was not run.
- Real PostgreSQL RLS assertions passed; CI now runs the same isolated harness.
- Production build, lint, typecheck, formatting, and diff whitespace checks
  passed. Existing lint/deprecation warnings remain.

Actual hosted signup and Stripe test checkout are not included in these passes;
see the pending external checks below.

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

Verify migration 061 in the target environment before enabling these surfaces.
Stage 1 records it as applied; that hosted state was not re-verified here.
Deploy the updated review API before the web reader so retry version checks are
available when outbox writes begin. No hosted migration was applied during this pass.

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

## External signup and checkout

Pending staging identification and Stripe test credentials. The existing API
environment contains a live Stripe key; it was not used for checkout testing.

The remaining end-to-end check must use a staging Supabase project, a test
mailbox, and Stripe test mode. Verify the magic-link return, migrated guest
progress and reviews, checkout amount, signed webhook delivery, world access,
and idempotent webhook replay. A local passing form test or SQL signup trigger
assertion does not substitute for those external checks.
