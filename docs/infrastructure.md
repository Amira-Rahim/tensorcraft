# Tensorcraft — Infrastructure & Deployment

> Last updated: 2026-04-07 (Vercel migration for web app; API remains on Fly.io)

This document covers the production deployment architecture, scaling configuration, and operational runbook for TensorCraft.

---

## Deployment Topology

```
[Cloudflare CDN] → Edge cache (static assets, bridges, glossary)
       ↓ (cache miss or dynamic)
[Vercel: Next.js App] → SSR (ISR planned for Phase 3)
       ↓ (client-side API calls)
[Cloudflare CDN] → [Fly.io: Hono API ×3-5]
                         → [Upstash Redis] (rate limiting + JWT cache + query cache)
                         → [Supabase Supavisor] → [Postgres Primary]
                                                 → [Postgres Read Replica]
                         → [Inngest] → Background Workers (Phase 5)
```

---

## Fly.io Services

### API Service (`tensorcraft-api`)

| Property | Value |
|----------|-------|
| Image | Hono + Node.js (multi-stage Docker) |
| Instances | 3–5 |
| Memory | 256MB |
| Region | `iad` (co-located with Supabase) |
| Health check | `GET /api/health` every 10s |
| Config | `apps/api/fly.toml` |
| Dockerfile | `apps/api/Dockerfile` |

---

## Vercel (Web App)

| Property | Value |
|----------|-------|
| Platform | Vercel (Hobby plan, free tier) |
| Framework | Next.js (auto-detected) |
| Root directory | `apps/web` |
| Deploy trigger | Auto-deploy from GitHub `main` branch |
| Custom domains | `tensorcraft.app`, `www.tensorcraft.app` |
| Environment variables | Managed in Vercel dashboard |

### Deploying

**Web app (Vercel):** Pushing to the `main` branch on GitHub triggers an automatic Vercel deployment. No manual deploy commands needed. Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`) are managed in the Vercel dashboard.

**API (Fly.io):** Must be deployed **from the monorepo root** so that the Docker build context includes all `packages/*` dependencies. The Dockerfile uses root-relative `COPY` paths (e.g., `COPY packages/shared/package.json packages/shared/`).

```bash
# Deploy from monorepo root — always use --config and --dockerfile flags
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile

# Set secrets (first deploy only)
fly secrets set -a tensorcraft-api \
  SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
  STRIPE_SECRET_KEY="..." STRIPE_WEBHOOK_SECRET="..." \
  UPSTASH_REDIS_REST_URL="..." UPSTASH_REDIS_REST_TOKEN="..." \
  ADMIN_API_KEY="..."
```

> **Why from root?** The `.dockerignore` at the repo root controls what enters the build context. Deploying from a subdirectory would make `packages/*` paths invisible to Docker.

---

## Cloudflare CDN Rules

Vercel handles CDN and edge caching for the web app (`tensorcraft.app`). Cloudflare is now used only to proxy the API subdomain (`api.tensorcraft.app`) to Fly.io.

| Asset Type | Cache Rule | TTL |
|------------|-----------|-----|
| `/api/*` (via `api.tensorcraft.app`) | Bypass Cache | 0 (pass through to Fly.io) |

---

## Supabase Configuration

### Tier Requirements

| Users | Min Tier | Why |
|-------|----------|-----|
| <10K | Pro ($25/mo) | 500K requests/month sufficient |
| 10K-100K | Pro + compute add-on ($75-150/mo) | Need larger connection pool + more compute |
| 100K-500K | Team ($599/mo) or Enterprise | 1M+ requests/month, read replicas, priority support |
| 500K+ | Enterprise (custom) | Custom connection limits, dedicated compute, SLA |

**Current bottleneck:** Supabase REST API requests are metered. Each Supabase query from the frontend or API counts as one request. The dashboard page makes 5 queries per load. At 100K monthly active users × 10 page loads/month × 5 queries = 5M requests/month — exceeds Pro tier limits.

**Mitigation strategies (already implemented or planned):**
- Dashboard query limits (300 rows max) — reduces data transfer
- JWT caching (30s) — reduces auth validation calls by ~95%
- Materialized view — replaces 4 queries with 1 (Phase 3)
- Redis cache layer — intercepts hot reads before Supabase (Phase 4)

### Connection Pooling

- **Pooler:** Supavisor (transaction mode)
- **Pool size:** 100
- **Port:** 6543 (pooler) vs 5432 (direct)
- **Direct connections:** Used only for migrations and admin scripts

**Important:** Transaction mode does not support `auth.uid()` in RLS policies. API routes use the service-role client with explicit `.eq("user_id", userId)` WHERE clauses instead.

### Read Replica (Phase 4)

- Use for: dashboard stats, analytics, admin queries
- Do NOT use for: writes, real-time progress updates
- Supabase Pro plan includes 2 read replicas

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| 001–011 | Core schema (profiles, progress, purchases, streaks, achievements, exercises, genome, events) |
| 012 | Scalability indexes, `dashboard_stats` materialized view, streak advisory lock |
| 013 | skill_events monthly partitioning (maintenance window required) |

### Materialized View: `dashboard_stats`

Pre-computed aggregation prepared to replace 4 parallel queries on dashboard load. The view is created and populated (migration 012) but the dashboard page has **not yet been migrated** to query it — it still makes 4 parallel Supabase queries with `.limit(300)` and `.limit(200)`. Migration to use the view is planned for Phase 4. Refreshes every 5 minutes via pg_cron (Supabase Pro) or Inngest worker (Phase 5).

**First refresh** after creation must omit `CONCURRENTLY`. Subsequent refreshes use `REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats`.

---

## Upstash Redis

**Required** — the API will not start without `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### Usage

| Feature | Key Pattern | TTL |
|---------|------------|-----|
| Rate limiting | `rl:{ip}` (sorted set) | 120s |
| JWT cache | `jwt:{sha256_prefix}` | 30s |
| Dashboard cache (Phase 4) | `dash:{userId}:{themeId}` | 60s |
| Purchase cache (Phase 4) | `purchase:{userId}:{themeSlug}` | 5 min |

### Rate Limiting

Sliding-window algorithm using sorted sets. 120 requests/minute per IP (increased from 60 to support multi-tab usage). Consistent across all API instances. Graceful degradation: if Redis is unavailable, requests are allowed through (logged for monitoring). Headers returned:

- `X-RateLimit-Limit: 120`
- `X-RateLimit-Remaining: N`
- `Retry-After: 60` (on 429)

### JWT Token Caching

Validated JWT claims cached for 30 seconds. Reduces Supabase auth validation calls by ~95% under sustained load. Uses SHA-256 hash of token as key (collision-safe at 1M+ users).

**Accepted risk:** Revoked tokens remain valid for up to 30 seconds.

---

## Skill Events Batching

Client-side events are buffered in memory and flushed:
- Every 5 seconds (timer)
- When buffer hits 50 events (capacity)
- On page visibility change / navigation (with `keepalive: true`)

API endpoint `POST /api/skill-events/batch` accepts 1–50 events per request with per-event validation. Reduces DB write pressure by ~5× at scale.

---

## Skill Genome Computation

After each lesson completion, the client calls `compute_user_skill_genome(p_user_id, p_theme_id)` via Supabase RPC (fire-and-forget). The SQL function (migration 014):
- Reads skill_events from the last 90 days for the user+theme
- Computes weighted proficiency per skill axis (pass=+3, complete=+2, bridge=+1, fail=-0.5, hint=-0.25, solution=-1)
- Normalizes to 0–100, computes confidence (event_count/50, capped at 1.0) and velocity (delta from previous)
- Upserts into `skill_genome` table

The dashboard radar chart reads from `skill_genome` on page load, so proficiency updates appear within seconds of lesson completion.

---

## Email Integration (Kit)

After `checkout.session.completed` in the Stripe webhook handler:
1. User email is looked up from the `profiles` table
2. `addSubscriber(email)` adds/updates the subscriber in Kit
3. `tagSubscriber(email, tagId)` tags them with a purchase tag (numeric ID from env var `KIT_TAG_PURCHASED_DEEP_ORBIT`)
4. Kit automation triggers the confirmation email based on the tag

Email delivery is fire-and-forget — Kit failures do not block the purchase flow. All email content and design is managed in the Kit dashboard, not in code.

---

## Cost Projection

| Component | 100K Users | 500K Users | 1M Users |
|-----------|-----------|-----------|---------|
| Vercel (web, Hobby) | $0/mo | $0/mo | $0/mo |
| Fly.io (API, 3–5 machines) | $15/mo | $75/mo | $200/mo |
| Cloudflare Pro | $20/mo | $20/mo | $20/mo |
| Supabase Pro + Compute + Read Replica | $50/mo | $175/mo | $400/mo |
| Upstash Redis | $10/mo | $60/mo | $200/mo |
| Inngest (Phase 5) | Free | $50/mo | $150/mo |
| **Total** | **~$95/mo** | **~$380/mo** | **~$970/mo** |

---

## Monitoring & Alerts

| Metric | Warning | Critical |
|--------|---------|----------|
| Supavisor pool utilization | >80% | >95% |
| Query p95 latency | >500ms | >2s |
| skill_events partition size | >50M rows | >100M rows |
| Redis hit rate | <70% | <50% |
| API error rate (5xx) | >1% | >5% |
| Fly.io machine CPU | >70% sustained | >90% sustained |
| Fly.io machine memory | >80% | >95% |

---

## Capacity Ceiling

| Phase Completed | Users Supported | Limiting Factor |
|----------------|----------------|-----------------|
| Phase 1 (Database) | 100K | API throughput |
| Phase 2 (API) | 200K | Frontend SSR load |
| Phase 3 (Frontend ISR + SWR) | 300K | DB read pressure |
| Phase 4 (Edge Cache + Read Replica) | 500K | Background computation |
| Phase 5 (Inngest Workers) | 800K–1M | Postgres write throughput |
| Beyond 1M | Requires CQRS or sharding | — |

---

## Remaining Phases

### Phase 3: Frontend (Week 5–6)
- ISR for lesson pages with auth overlay separation
- Dashboard → client-side SWR (no SSR)
- Dynamic imports for below-fold landing page components

### Phase 4: Edge Cache (Week 7–8)
- Redis cache-through layer for hot reads (dashboard, purchases, modules)
- Read replica routing for analytics queries
- Cache invalidation on writes

### Phase 5: Background Workers (Week 9–10)
- Inngest: Skill genome computation (every 5 min, per active user)
- Inngest: Event archival (monthly, detach old partitions)
- Inngest: Dashboard stats refresh (fallback if pg_cron unavailable)
