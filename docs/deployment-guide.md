# Tensorcraft Deployment Guide

## Prerequisites

- Node.js 20+
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
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog instance URL - **must be EU** (`https://eu.posthog.com`) for GDPR residency |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for client + server + edge error tracking (EU-region project) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Domain registered in Plausible (e.g., `tensorcraft.app`) |

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
| `POSTHOG_KEY` | No | PostHog server-side key for webhook-triggered conversion events |
| `POSTHOG_HOST` | No | PostHog host - **must be EU** (`https://eu.posthog.com`) |

### Optional Integrations (`apps/api`)

#### GitHub Integration

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |

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
- ESLint runs in CI, not during `next build` (configured via `eslint.ignoreDuringBuilds`).

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

**Database Backup Strategy:** Supabase Pro plans include daily automated backups with point-in-time recovery (PITR). For additional safety, schedule weekly `pg_dump` exports via a cron job or GitHub Action and store them in a separate cloud storage bucket (e.g., S3 or GCS). Test restore procedures quarterly.

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
    `requestId`, `route`, and `method` so every captured error is
    correlated to a Hono request ID.
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

- **Web** - `apps/web/lib/posthog.ts` handles client-side init,
  mounted via `apps/web/app/posthog-provider.tsx`. Consent-gated via
  the `tc-cookie-consent` localStorage flag.
- **API** - `apps/api/src/lib/posthog.ts` exposes a `posthog-node`
  client for webhook-triggered conversion events. Only constructed
  when `POSTHOG_KEY` is set.

Host **must** be `https://eu.posthog.com` (enforced by default in
both init paths) for GDPR data residency. DPA required - see
`docs/privacy-compliance.md`.

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
