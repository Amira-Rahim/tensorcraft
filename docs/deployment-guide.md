# Tensorcraft Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase project (with Auth enabled)
- Stripe account (with webhook endpoint configured)
- Vercel account (for frontend)
- Fly.io or Railway account (for API)

---

## Environment Variables

### Frontend (`apps/web`)

Set these in Vercel dashboard or `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key |
| `NEXT_PUBLIC_API_URL` | Yes | API service URL (e.g., `https://api.tensorcraft.dev`) |

### API (`apps/api`)

Set these in Fly.io/Railway dashboard or `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, never expose to client) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `PORT` | No | API server port (default: `3001`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST API URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST API token |
| `ADMIN_API_KEY` | No | API key for admin endpoints |

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

### Frontend (Vercel)

The Next.js app deploys to Vercel via Git integration:

1. Connect the repository to Vercel
2. Set root directory to `apps/web`
3. Set build command: `cd ../.. && pnpm build --filter @tensorcraft/web`
4. Set output directory: `apps/web/.next`
5. Add environment variables in Vercel dashboard
6. Enable preview deployments for PRs

Turborepo handles package dependencies — Vercel's build will compile all workspace packages first.

### API (Fly.io / Railway)

The Hono API runs as a long-lived Node.js process:

1. Create a Fly.io app or Railway service
2. Set the root directory to `apps/api`
3. Build command: `pnpm build`
4. Start command: `node dist/index.js`
5. Add environment variables in the platform dashboard
6. Configure health check endpoint: `GET /api/health`

### Database (Supabase)

Supabase is managed via their dashboard:

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations from `packages/supabase/migrations/` in order
3. Enable Row-Level Security on all tables
4. Configure Auth providers (GitHub OAuth, Google OAuth, Magic Link)
5. Set up OAuth redirect URLs for your domain

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

Limit: 60 requests per minute per IP. The Stripe webhook route is exempt.

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
