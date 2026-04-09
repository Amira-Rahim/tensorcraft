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

### API (`apps/api`)

Set these in Fly.io secrets or `.env` for local dev:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, never expose to client) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `PORT` | No | API server port (default: `3001`) |
| `APP_URL` | No | Application URL used for Stripe checkout redirects (fallback: `NEXT_PUBLIC_APP_URL` or `http://localhost:3000`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST API URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST API token |
| `ADMIN_API_KEY` | Yes | API key for admin endpoints (used by CI/scripts as fallback to role-based auth) |

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

Set secrets with `fly secrets set -a tensorcraft-api KEY=VALUE`.

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

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR:

1. **Install** — `pnpm install`
2. **Lint** — `pnpm lint`
3. **Typecheck** — `pnpm typecheck`
4. **Build** — `pnpm build` (includes content compilation)
5. **Unit Tests** — `pnpm test`
6. **E2E Tests** — Install Playwright browsers, then `pnpm test:e2e`

### Pre-commit Hooks

Husky + lint-staged runs on every commit:
- `*.{ts,tsx,mts}` — `prettier --write` + `eslint --fix`
- `*.{json,md,css,html}` — `prettier --write`

---

## Rate Limiting

The API uses a two-tier rate limiting strategy:

1. **Primary: Upstash Redis** — When `UPSTASH_REDIS_REST_URL` is set, rate limits are stored in Redis for distributed, production-ready limiting across multiple instances.
2. **Fallback: In-memory Map** — When Redis is not configured, an in-memory Map tracks request counts per IP. Suitable for single-instance deployments and local development.

Limit: 120 requests per minute per IP. The Stripe webhook route is exempt.

---

## Monitoring

### Error Tracking

The API includes a structured error logging utility (`apps/api/src/lib/error-tracking.ts`) that outputs JSON-formatted errors:

```json
{
  "level": "error",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "message": "Payment processing failed",
  "source": "payments.webhook",
  "userId": "uuid",
  "stack": "Error: ..."
}
```

This is designed as a drop-in replacement for Sentry — when ready, swap the console calls with `Sentry.captureException()`.

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
