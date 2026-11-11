# Tensorcraft Deployment Guide

## Prerequisites

- Node.js 22+
- pnpm 10+
- Supabase project (with Auth enabled)
- Stripe account (with webhook endpoint configured)
- Fly.io account (API), Vercel account (web)

---

## Environment Variables

### Frontend (`apps/web`)

Set these in Vercel Environment Variables dashboard or `.env.local` for local dev:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key |
| `NEXT_PUBLIC_API_URL` | Yes | API service URL (e.g., `https://api.tensorcraft.app`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key for product analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | EU ingestion host from the PostHog project settings (`https://eu.i.posthog.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for client + server + edge error tracking (EU-region project) |

### API (`apps/api`)

Set these in Fly.io secrets or `.env` for local dev:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, never expose to client) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `STRIPE_TAX_ENABLED` | Launch | "true" enables Stripe Tax + invoices on checkout. Requires dashboard Tax setup + migration 047 applied first. Unset = silently untaxed sales (legal exposure R2-4/R3-3) |
| `CERT_SIGNING_SECRET` | Yes | Certificate signing secret - unset, certificate issuance 500s (fail-closed) |
| `PORT` | No | API server port (default: `3001`) |
| `APP_URL` | No | Application URL used for Stripe checkout redirects (fallback: `NEXT_PUBLIC_APP_URL` or `http://localhost:3000`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `UPSTASH_REDIS_REST_URL` | Prod: yes | Upstash Redis REST URL. Unset, the API still boots and serves but rate limiting + JWT cache are SILENTLY DISABLED (security degradation, R3-10) |
| `UPSTASH_REDIS_REST_TOKEN` | Prod: yes | Upstash Redis REST token (same silent-degradation caveat) |
| `ADMIN_API_KEY` | Yes | API key for admin endpoints (used by CI/scripts as fallback to role-based auth) |
| `SENTRY_DSN` | No | Sentry DSN for the API (EU-region project) |
| `POSTHOG_PROJECT_TOKEN` | Analytics | Project token for server webhook events. The API does not read `POSTHOG_KEY`. |
| `POSTHOG_HOST` | Analytics | EU ingestion host from the same PostHog project (`https://eu.i.posthog.com`) |

### Optional Integrations (`apps/api`)

#### GitHub Integration

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | Integration | Registered callback URL. Production uses `https://api.tensorcraft.app/api/github/callback`. |
| `GITHUB_TOKEN_ENC_KEY` | Integration, required in production | Encryption key for stored GitHub tokens; the OAuth callback fails without it, and the deploy preflight checks for it. Preserve the existing key when deploying. |

#### Kit (ConvertKit) Email

See [`email-setup.md`](./email-setup.md) for SPF / DKIM / DMARC wiring and the
bounce-webhook configuration.

| Variable | Required | Description |
|----------|----------|-------------|
| `KIT_API_KEY` | No | Kit API key |
| `KIT_API_SECRET` | No | Kit API secret |
| `KIT_FORM_ID` | No | Kit signup form ID |
| `KIT_TAG_PURCHASED` | No | Numeric tag ID for purchase confirmation email |
| `KIT_TAG_SIGNED_UP` | No | Numeric tag ID for signed_up lifecycle event |
| `KIT_TAG_ONBOARDED` | No | Numeric tag ID for onboarded lifecycle event |
| `KIT_TAG_FIRST_LESSON` | No | Numeric tag ID for first_lesson lifecycle event |
| `KIT_TAG_CAPSTONE` | No | Numeric tag ID for capstone lifecycle event |
| `KIT_TAG_EMAIL_ALERTS` | No | Tag ID for "email on lesson complete" (toggled in /settings) |
| `KIT_TAG_WEEKLY_DIGEST` | No | Tag ID for Sunday progress digest (toggled in /settings) |
| `KIT_WEBHOOK_SECRET` | No | Shared secret for `POST /api/webhooks/kit-bounce` (required for bounce monitoring) |

#### Resend (Issue Notifications)

| Variable          | Required | Description                                    |
|-------------------|----------|------------------------------------------------|
| `RESEND_API_KEY`  | No       | Resend API key                                 |
| `SUPPORT_EMAIL`   | No       | Email address for issue report notifications   |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start all services (web on :3000, api on :3001)
pnpm dev

# Build content (required before first build)
pnpm --filter @tensorcraft/content build:content

# Full build
pnpm build

# Run tests
pnpm test          # Unit tests (Vitest)
pnpm test:e2e      # E2E tests (Playwright, requires dev server)

# Lint and format
pnpm lint
pnpm format
```

---

## Deployment Targets

### Web (Vercel)

The Next.js web app deploys to Vercel:

- **Automatic deploys:** Pushes to `main` trigger a production deployment automatically.
- **Manual deploys:** Go to Vercel dashboard → Deployments → Redeploy.
- **Environment variables:** Set in Vercel dashboard (Settings → Environment Variables).
- ESLint runs through `pnpm lint` in CI, separately from the production build.

The Vercel project root is `apps/web`. Its build configuration lives in
`apps/web/vercel.json`; a root `vercel.json` is ignored for this project.
After dependency installation, the build runs the migration status check
with `CI=1` before Turbo. Pending or unknown migrations, unavailable database
access, and missing CI credentials stop the build. Configure the database
connection used by `scripts/migration-status.mjs` in Vercel's build environment.
Apply additive schema changes before deploying code that reads them.

For an authorized CLI deployment, run from the monorepo root:

```bash
pnpm dlx vercel@59.23.2 --prod --yes
```

Version 59.23.2 completed the September 19 release; the previously installed
41.1.4 CLI was rejected by Vercel's upload API. The root `.vercelignore`
excludes local secrets, study records, runtime environments and audit artifacts
from CLI uploads. Do not rely on `.gitignore` for this deployment path.
`SENTRY_AUTH_TOKEN` stays in the deployment environment and passes through
Turbo for build-time source-map upload; it is not a public variable.

The [September 19 release record](audits/learning-product-release-2026-09-19.md)
contains the deployed IDs, schema ledger, smoke checks and rollback targets.
Reverting the application should retain the additive schema and learner data.

### API (Fly.io)

The Hono API deploys to Fly.io using a multi-stage Docker build. **Deploy from the monorepo root** so the build context includes all workspace packages:

```bash
# From the monorepo root
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
```

The API has its own `fly.toml` and `Dockerfile` in its directory. The root `.dockerignore` controls what enters the build context.

**API (`tensorcraft-api`):**

- Hono + Node.js, 256MB machines, port 3001
- Health check: `GET /api/health`
- V8 heap capped at 200MB

Set secrets with `fly secrets set -a tensorcraft-api KEY=VALUE`, or bulk-import
from the local env file without values touching argv:
`grep '^KEY=' apps/api/.env | fly secrets import -a tensorcraft-api`.

**Secrets preflight:** `pnpm deploy:preflight` diffs the required lists in
`apps/api/src/env.ts` (ALWAYS_REQUIRED + PROD_REQUIRED - the image bakes
`NODE_ENV=production`, so both apply) against `fly secrets list` names.
`deploy-api.yml` runs it before `flyctl deploy` and fails closed (exit 1 =
missing vars, exit 2 = could not check). Added after the 2026-07-25 incident
where a green deploy crash-looped at boot on two unset secrets
(`CERT_SIGNING_SECRET`, `KIT_WEBHOOK_SECRET`) - the migration gate cannot see
runtime env, so this gate exists specifically for it. A drift-guard test
(`apps/api/src/__tests__/deploy-preflight.test.ts`) pins the script's env.ts
parse against the real exports.

### Database (Supabase)

Supabase is managed via their dashboard:

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations from `packages/supabase/migrations/` in order
3. Enable Row-Level Security on all tables
4. Configure Auth providers (GitHub OAuth, Google OAuth, Magic Link)
5. Set up OAuth redirect URLs for your domain

**Database Backup Strategy:** The production project has daily managed backups.
PITR is a separate option and is not enabled. On 2026-09-16, a fresh read-only
logical export of the `public`, `auth`, and `storage` schemas was restored into
an isolated local database. All 69 table counts and content fingerprints matched;
the temporary database and export were then removed. This checks logical
database recovery, not restoration of a managed snapshot or Storage file bytes.
See [`launch-verification.md`](./launch-verification.md) for the remaining
managed-snapshot restore check. Repeat recovery drills quarterly.

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR, as
parallel jobs since 2026-08-23 (see `docs/ci-cd.md` for the full table):

- **checks** - `pnpm lint`, `pnpm format:check`, `pnpm typecheck`
- **audit** - `pnpm audit --prod` (isolated so registry advisories cannot
  block other signals)
- **build** - `pnpm build` with no env vars (regression test for building
  without runtime secrets)
- **unit-tests** - `pnpm test` + exercise validator
- **e2e** - builds the web app with placeholder Supabase env, serves it via
  `next start`, runs `pnpm test:e2e` (Playwright)

### Pre-commit Hooks

Husky + lint-staged runs on every commit:
- `*.{ts,tsx,mts}` - `prettier --write` + `eslint --fix`
- `*.{json,md,css,html}` - `prettier --write`

---

## Rate Limiting

The API uses a two-tier rate limiting strategy:

1. **Primary: Upstash Redis** - When `UPSTASH_REDIS_REST_URL` is set, rate limits are stored in Redis for distributed, production-ready limiting across multiple instances.
2. **Fallback: In-memory Map** - When Redis is not configured, an in-memory Map tracks request counts per IP. Suitable for single-instance deployments and local development.

Limit: 60 requests per minute per IP (code truth; reconciled 2026-07-25). The Stripe webhook route is exempt.

---

## Monitoring

### Error Tracking - Sentry

Both apps are wired to Sentry (Phase 6 §6g). Initialization is gated
on the DSN env vars, so dev/preview without a DSN runs as a complete
no-op.

- **Web (`apps/web`)** - `@sentry/nextjs` initialized via
  `sentry.client.config.ts`, `sentry.server.config.ts`, and
  `sentry.edge.config.ts`. Registered through `instrumentation.ts`.
  DSN: `NEXT_PUBLIC_SENTRY_DSN`.
  - `tracesSampleRate: 0.1`
  - `replaysSessionSampleRate: 0`
  - `replaysOnErrorSampleRate: 1.0`
  - Hydration-mismatch and browser-extension noise are filtered out
    via `ignoreErrors`.
  - `error.tsx` and `global-error.tsx` call `Sentry.captureException`
    so both route-level and app-level boundaries report.
- **API (`apps/api`)** - `@sentry/node` initialized at the top of
  `src/index.ts` (before Hono). DSN: `SENTRY_DSN`.
  - A `sentryMiddleware` tags each request's Sentry scope with
    `requestId`, `route`, `method`, and `source` so every captured error is
    correlated to a Hono request ID.
  - Handled HTTP 5xx responses also report an error. The `source` tag lets
    payment and GitHub failures match their configured alert rules.
  - `unhandledRejection` and `uncaughtException` are forwarded.
  - `app.onError` calls `Sentry.captureException` with the same tags.

**PII scrubbing**: `beforeSend` hooks in every config strip
`event.user` (id/email/username/ip), `cookie`/`authorization` headers,
and any `extra.email` / `extra.user_id` before the event leaves the
runtime. See `docs/privacy-compliance.md` for the full policy.

Separate Sentry projects must be created for web and API, both in the
EU region. Data Processing Agreement with Sentry must be signed before
production launch (see `docs/privacy-compliance.md`).

### Product Analytics - PostHog (EU instance)

- **Web** - `apps/web/lib/posthog.ts` handles client-side init, called
  from `apps/web/app/components/analytics-provider.tsx`. Consent-gated via
  a current versioned browser choice (`apps/web/lib/consent.ts`).
- **API** - `apps/api/src/lib/posthog.ts` exposes a `posthog-node`
  client for webhook-triggered conversion events. Captures require both
  `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST`, plus current stored account
  consent. Missing consent or a failed lookup skips capture. Apply migration
  067 and deploy the consent protection before enabling these settings.
  Server exception autocapture is disabled.

Use `https://eu.i.posthog.com`, the connected EU project's ingestion host.
`https://eu.posthog.com` is its dashboard URL. Both init paths read the host
from configuration. DPA requirements are in `docs/privacy-compliance.md`.

### Legacy stub

The earlier `apps/api/src/lib/error-tracking.ts` utility remains as a
plain structured-JSON logger for call sites that predate Sentry. New
code should use `Sentry.captureException` or the per-request
`c.get("logger")` Pino child instead.

### Health Check

`GET /api/health` returns service status. Configure your hosting platform to poll this endpoint.

---

## Security Checklist

- [ ] All environment variables set (no defaults for secrets)
- [ ] Stripe webhook signature verification enabled
- [ ] CORS origins restricted to production domains
- [ ] Supabase RLS policies active on all tables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- [ ] Admin API key set for admin endpoints
- [ ] Rate limiting configured (Redis for multi-instance)
- [ ] HTTPS enforced on all endpoints

---

## Performance & Bundle Budgets

### Core Web Vitals (Phase 6c targets)

- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1
- INP (Interaction to Next Paint) < 200ms

Enforced via Lighthouse CI on every pull request - see
`.github/workflows/lighthouse.yml`, `.github/lighthouserc.json`, and
`.github/lighthouse-budget.json`. Category thresholds:

| Category | Min score |
|----------|-----------|
| Performance | 0.90 |
| Accessibility | 0.95 |
| Best Practices | 0.90 |
| SEO | 0.90 |

Tested URLs: `/`, `/pricing`, `/worlds`, `/learn`. Dashboard + settings
require auth and are skipped until a test-mode session is plumbed through
the middleware.

### First-load JS budgets

Measured from `next build` output (`apps/web/`). Budgets are ceilings - if a
PR exceeds them, investigate before merging. Values below reflect
2026-04-21 baseline.

| Route | First-load JS | Budget |
|-------|---------------|--------|
| `/` (landing) | ~163 kB | **≤ 200 kB** |
| `/pricing` | ~240 kB | **≤ 250 kB** |
| `/onboarding` | ~237 kB | **≤ 250 kB** |
| `/worlds` | ~170 kB | **≤ 200 kB** |
| `/dashboard` | ~120 kB | **≤ 200 kB** |
| `/worlds/[slug]/[module]/[lesson]` (exercise) | ~473 kB | **≤ 500 kB** |
| Shared chunks | ~106 kB | **≤ 120 kB** |

The lesson route is heaviest because it lazy-loads Sandpack
(`@codesandbox/sandpack-react`, ~500 kB gzipped on first use) via
`React.lazy` - it is code-split and not on the critical path. See
`packages/ui/src/mdx/exercise.tsx`.

### Running bundle analysis locally

```bash
pnpm --filter @tensorcraft/web analyze
```

This runs `ANALYZE=true next build`, which opens HTML treemaps for
client/server/edge chunks. Use them to identify regressions before PR.

### Animation budget

Decorative effects in `@tensorcraft/ui` (see
`packages/ui/src/effects/index.ts`) respect `prefers-reduced-motion` and
pause via `IntersectionObserver` when scrolled out of view. At most 3
animations should run per viewport at any time; keep this in mind when
composing landing / marketing pages.
