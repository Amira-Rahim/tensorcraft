# Tensorcraft — Infrastructure & Deployment

> Last updated: 2026-03-27 (Scalability Phase 1-2 complete)
> Design spec: `docs/superpowers/specs/2026-03-27-scalability-design.md`

This document covers the production deployment architecture, scaling configuration, and operational runbook for TensorCraft.

---

## Deployment Topology

```
[Cloudflare CDN] → Edge cache (static assets, ISR pages, bridges, glossary)
       ↓ (cache miss or dynamic)
[Fly.io: Next.js Standalone ×2-4] → ISR file cache (per-machine)
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

### Web Service (`tensorcraft-web`)

| Property | Value |
|----------|-------|
| Image | Next.js standalone (`output: "standalone"`) |
| Instances | 2–4 |
| Memory | 512MB |
| Regions | `iad` (US-East), `cdg` (EU), `nrt` (Asia) |
| Static assets | Served via `[[statics]]` directive |
| Config | `apps/web/fly.toml` |
| Dockerfile | `apps/web/Dockerfile` |

### Deploying

```bash
# API
cd apps/api
fly deploy

# Web
cd apps/web
fly deploy

# Set secrets (first deploy only)
fly secrets set SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
  STRIPE_SECRET_KEY="..." STRIPE_WEBHOOK_SECRET="..." \
  UPSTASH_REDIS_REST_URL="..." UPSTASH_REDIS_REST_TOKEN="..." \
  NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

---

## Cloudflare CDN Rules

| Asset Type | Cache Rule | TTL |
|------------|-----------|-----|
| `/_next/static/*` | Cache Everything | 1 year (immutable content hash) |
| `/bridges/*`, `/glossary/*` | Cache Everything | 24 hours |
| Lesson pages (ISR) | Respect Origin Headers | 1 hour (`s-maxage=3600`) |
| `/api/*` | Bypass Cache | 0 (pass through to Fly.io) |
| Dashboard, settings | Bypass Cache | 0 (authenticated, dynamic) |

---

## Supabase Configuration

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

Pre-computed aggregation replacing 4 parallel queries on dashboard load. Refreshes every 5 minutes via pg_cron (Supabase Pro) or Inngest worker (Phase 5).

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

Sliding-window algorithm using sorted sets. 60 requests/minute per IP. Consistent across all API instances. Headers returned:
- `X-RateLimit-Limit: 60`
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

## Cost Projection

| Component | 100K Users | 500K Users | 1M Users |
|-----------|-----------|-----------|---------|
| Fly.io (web, 2–4 machines) | $15/mo | $60/mo | $150/mo |
| Fly.io (API, 3–5 machines) | $15/mo | $75/mo | $200/mo |
| Cloudflare Pro | $20/mo | $20/mo | $20/mo |
| Supabase Pro + Compute + Read Replica | $50/mo | $175/mo | $400/mo |
| Upstash Redis | $10/mo | $60/mo | $200/mo |
| Inngest (Phase 5) | Free | $50/mo | $150/mo |
| **Total** | **~$110/mo** | **~$440/mo** | **~$1,120/mo** |

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
