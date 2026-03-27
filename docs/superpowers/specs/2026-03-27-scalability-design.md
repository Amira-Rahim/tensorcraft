# Scalability Design: 500K–1M Users

> **Approach:** A+B Hybrid — Scale the current stack + selective edge caching and background workers
> **Platform:** Fly.io (compute) + Cloudflare (CDN/edge) + Upstash Redis (cache/rate-limit) + Supabase (Postgres/Auth) + Inngest (background jobs)
> **Target:** 500K–1M concurrent users
> **Timeline:** 10 weeks across 5 phases

---

## Current Bottlenecks

| Component | Issue | Breaks At |
|-----------|-------|-----------|
| Database | 10-connection pool (Supabase default) | ~50K users |
| Database | Missing indexes on exercise_attempts, skill_events | ~100K users |
| Database | Unbounded skill_events table (append-only, no partitioning) | ~200K users (Year 2) |
| API | Single-threaded Node.js (Hono) | ~10K concurrent requests |
| API | In-memory rate limiting (not distributed) | Any multi-instance deploy |
| API | 1 DB insert per skill event (no batching) | ~100K users |
| Frontend | Dashboard SSR with 4 parallel DB queries per load | ~100K users |
| Frontend | Lesson pages fully SSR'd (no ISR/edge cache) | ~200K users |
| Database | Streak RPC race condition (SELECT → UPDATE gap) | Rare but data-corrupting |

---

## Architecture

### Deployment Topology

```
[Cloudflare CDN] → Edge cache (static assets, ISR pages, bridges, glossary)
       ↓ (cache miss or dynamic)
[Fly.io: Next.js Standalone ×2-4] → ISR file cache (per-machine)
       ↓ (client-side API calls)
[Cloudflare CDN] → [Fly.io: Hono API ×3-5]
                         → [Upstash Redis] (rate limiting + read cache)
                         → [Supabase PgBouncer] → [Postgres Primary]
                                                 → [Postgres Read Replica]
                         → [Inngest] → Background Workers
```

### Fly.io Services

| Service | Image | Instances | Memory | Regions |
|---------|-------|-----------|--------|---------|
| `tensorcraft-web` | Next.js standalone (`output: "standalone"`) | 2–4 | 512MB | iad (US-East), cdg (EU), nrt (Asia) |
| `tensorcraft-api` | Hono + Node.js | 3–5 | 256MB | Co-located with Supabase region |

### Cloudflare Cache Rules

| Asset Type | Rule | TTL |
|------------|------|-----|
| `/_next/static/*` | Cache Everything | 1 year (immutable hash) |
| `/bridges/*`, `/glossary/*` | Cache Everything | 24 hours |
| Lesson pages (ISR) | Respect Origin Headers | 1 hour (`s-maxage=3600`) |
| `/api/*` | Bypass Cache | 0 (pass through) |
| Dashboard, settings | Bypass Cache | 0 (authenticated) |

---

## Phase 1: Database (Week 1–2)

**Goal:** Remove the foundation-level bottlenecks that would cause failures at 100K users.

### 1.1 Connection Pooling

Enable Supabase's Supavisor pooler in transaction mode. Session mode would hold connections for the entire request lifecycle, defeating the purpose of pooling at scale.

- **Where:** Supabase Dashboard → Project Settings → Database → Connection Pooling
- **Mode:** Transaction (Supavisor, not legacy PgBouncer)
- **Pool size:** 100

**Breaking change:** Transaction mode does not support `auth.uid()` in RLS policies because `set_config()` is session-scoped. Two migration paths:

- **Option A (recommended):** API routes already pass `userId` from JWT middleware. Switch RLS-dependent queries to use the service-role client with explicit `.eq("user_id", userId)` WHERE clauses. The API already does this for most routes.
- **Option B:** Use Supavisor's `--role` parameter to pass auth context per transaction. This is newer and less battle-tested.

Direct connections (for migrations, admin scripts) remain on the non-pooled endpoint.

### 1.2 Missing Indexes (Migration 012)

```sql
-- Exercise attempts: dashboard sorts by date per theme
CREATE INDEX idx_exercise_attempts_theme_date
  ON exercise_attempts(theme_id, attempted_at DESC);

-- Skill events: genome computation reads recent events per user
CREATE INDEX idx_skill_events_user_created
  ON skill_events(user_id, created_at DESC);

-- Theme progress: prerequisite checks filter by completed status
CREATE INDEX idx_theme_progress_completed
  ON theme_progress(user_id, theme_id, status)
  WHERE status = 'completed';
```

### 1.3 Materialized View for Dashboard

Replace application-level aggregation (4 queries + loops) with a pre-computed materialized view.

**Important:** `theme_progress` only contains rows for lessons a user has interacted with — not all 55 lessons. A user with 3/55 started lessons has 3 rows. Using `count(*)` as `total_lessons` would show 100% completion (3/3). Total lessons must be a constant from the content layer, injected as a literal.

```sql
-- Total lessons per theme is a content-layer constant (55 for all themes).
-- If themes ever have different lesson counts, this becomes a join to a themes table.
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  user_id,
  theme_id,
  55 AS total_lessons,  -- from THEME_CONTENT.totalLessonsPerTheme
  count(*) FILTER (WHERE status = 'completed') AS completed_lessons,
  count(*) FILTER (WHERE status = 'in_progress') AS in_progress_lessons,
  round(
    count(*) FILTER (WHERE status = 'completed')::numeric / 55.0 * 100, 1
  ) AS completion_pct,
  max(completed_at) AS last_activity
FROM theme_progress
GROUP BY user_id, theme_id;

CREATE UNIQUE INDEX ON dashboard_stats(user_id, theme_id);
```

Refresh via pg_cron every 5 minutes. **Note:** First refresh after creation must omit `CONCURRENTLY` (Postgres requirement — the view must be populated once before concurrent refresh works).

```sql
-- Initial refresh (run once after CREATE)
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Subsequent refreshes via cron
SELECT cron.schedule('refresh-dashboard-stats', '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats');
```

### 1.4 skill_events Table Partitioning

Convert to monthly range partitions. This requires a careful migration since the existing table has foreign keys, RLS policies, and indexes.

**Migration plan (requires brief write downtime or a maintenance window):**

```sql
-- Step 1: Create new partitioned table with same columns
CREATE TABLE skill_events_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'exercise_pass','exercise_fail','hint_reveal','solution_view',
    'lesson_complete','bridge_interaction','review_recall'
  )),
  skill_axis text NOT NULL CHECK (skill_axis IN (
    'data_prep','model_arch','training','evaluation','deployment','fe_integration'
  )),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Step 2: Create partitions for existing + upcoming months
CREATE TABLE skill_events_2026_03 PARTITION OF skill_events_new
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE skill_events_2026_04 PARTITION OF skill_events_new
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
-- ... create 6 months ahead

-- Step 3: Copy existing data
INSERT INTO skill_events_new SELECT * FROM skill_events;

-- Step 4: Recreate RLS policies on new table
ALTER TABLE skill_events_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON skill_events_new
  FOR SELECT USING (auth.uid() = user_id);

-- Step 5: Recreate indexes (partition-local, auto-created per partition)
CREATE INDEX ON skill_events_new(user_id);
CREATE INDEX ON skill_events_new(user_id, theme_id);
CREATE INDEX ON skill_events_new(user_id, created_at DESC);

-- Step 6: Atomic swap (requires brief lock)
BEGIN;
  ALTER TABLE skill_events RENAME TO skill_events_old;
  ALTER TABLE skill_events_new RENAME TO skill_events;
COMMIT;

-- Step 7: Drop old table after verifying
-- DROP TABLE skill_events_old;  -- run manually after verification
```

**Ongoing partition management:** Create new monthly partitions via pg_cron or Inngest worker 7 days before month end. Detach + archive partitions older than 90 days.

### 1.5 Streak Race Condition Fix

Add advisory lock to `record_streak_activity()`:

```sql
CREATE OR REPLACE FUNCTION public.record_streak_activity(p_theme_id text)
RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_existing record;
BEGIN
  -- Advisory lock prevents concurrent calls for same user+theme.
  -- Two-argument form gives 64-bit address space (vs 32-bit single-arg),
  -- reducing collision probability from ~0.3% to negligible at 1M users.
  PERFORM pg_advisory_xact_lock(
    hashtext(v_user_id::text),
    hashtext(p_theme_id)
  );

  -- ... existing SELECT/UPDATE logic unchanged ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 2: API (Week 3–4)

**Goal:** Make the API horizontally scalable and deploy to Fly.io.

### 2.1 Mandatory Redis Rate Limiting

Remove in-memory fallback. Fail hard if Redis is unavailable:

```typescript
// rate-limit.ts
if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error("UPSTASH_REDIS_URL required for production rate limiting");
}
```

Use Upstash Redis with sliding window algorithm. Consistent limits across all API instances.

### 2.2 JWT Token Caching

Cache validated JWT claims in Redis for 30 seconds:

```typescript
// auth.ts middleware
const cacheKey = `jwt:${hashToken(token)}`;
const cached = await redis.get(cacheKey);
if (cached) {
  c.set("userId", cached.userId);
  c.set("accessToken", token);
  return next();
}
// ... validate with Supabase, then cache ...
await redis.set(cacheKey, { userId }, { ex: 30 });
```

**Accepted risk:** If a token is revoked (password change, account suspension), the cached entry remains valid for up to 30 seconds. For a learning platform this is acceptable.

**Emergency invalidation path:** For account compromises, add an admin endpoint that busts all cached tokens for a user:

```typescript
// DELETE /api/admin/invalidate-sessions/:userId
await redis.eval(
  `for _,k in ipairs(redis.call('keys','jwt:*')) do
     local v = redis.call('get',k)
     if v and string.find(v, ARGV[1]) then redis.call('del',k) end
   end`, 0, userId
);
```

### 2.3 Batch Skill Events

New endpoint: `POST /api/skill-events/batch`

```typescript
const VALID_EVENT_TYPES = new Set([
  "exercise_pass", "exercise_fail", "hint_reveal", "solution_view",
  "lesson_complete", "bridge_interaction", "review_recall",
]);
const VALID_AXES = new Set([
  "data_prep", "model_arch", "training", "evaluation", "deployment", "fe_integration",
]);

// Accepts array of events (max 50 per request)
skillEvents.post("/batch", async (c) => {
  const { events } = await c.req.json();

  if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
    return c.json({ error: "events must be an array of 1-50 items" }, 400);
  }

  // Validate each event before inserting (DB CHECK constraints would reject
  // the entire batch on a single invalid value)
  for (const e of events) {
    if (!VALID_EVENT_TYPES.has(e.eventType)) {
      return c.json({ error: `Invalid eventType: ${e.eventType}` }, 400);
    }
    if (!VALID_AXES.has(e.skillAxis)) {
      return c.json({ error: `Invalid skillAxis: ${e.skillAxis}` }, 400);
    }
  }

  // Single multi-row INSERT
  await supabase.from("skill_events").insert(
    events.map(e => ({
      user_id: userId, theme_id: e.themeId,
      event_type: e.eventType, skill_axis: e.skillAxis,
      metadata: e.metadata ?? {},
    }))
  );
});
```

Client-side: buffer events in memory, flush every 5 seconds or on `visibilitychange` (page leave).

### 2.4 Fly.io Deployment

**Secrets migration:** All environment variables currently in `.env` must be set as Fly.io secrets before first deploy:

```bash
fly secrets set SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
  STRIPE_SECRET_KEY="..." STRIPE_WEBHOOK_SECRET="..." \
  UPSTASH_REDIS_URL="..." NEXT_PUBLIC_SUPABASE_URL="..." \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

**Note:** The Supabase connection string changes when using the Supavisor pooler (port 6543 instead of 5432, different hostname). Update `SUPABASE_URL` to the pooler endpoint for all API instances.

```toml
# fly.toml (tensorcraft-api)
[build]
  dockerfile = "apps/api/Dockerfile"

[http_service]
  internal_port = 3001
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 2

[checks]
  [checks.health]
    type = "http"
    port = 3001
    path = "/api/health"
    interval = "10s"
    timeout = "5s"
```

---

## Phase 3: Frontend (Week 5–6)

**Goal:** Reduce server load by caching content at the edge and moving dashboard to client-side fetching.

### 3.1 Dashboard: SSR → Client-Side with SWR

Create a new `/api/dashboard` endpoint that returns all dashboard data in one call (using the materialized view). Dashboard page becomes a thin server shell rendering a client component that fetches via SWR:

```typescript
// apps/web/app/dashboard/page.tsx (server — just auth check)
export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  return <DashboardView userId={user.id} />;
}

// DashboardView (client — fetches via SWR, caches 60s)
const { data } = useSWR(`/api/dashboard`, fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
});
```

### 3.2 Lesson Pages: ISR with Auth Separation

The lesson page currently mixes static content (MDX body, bridges) with per-user logic (paywall check, prerequisites, progress). Adding `revalidate = 3600` would fail because `auth.getUser()` returns null during static generation.

**Fix:** Split into a static shell and a dynamic client overlay:

```typescript
// apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx (SERVER)
export const revalidate = 3600; // ISR: rebuild every hour
export const dynamicParams = true;

export default async function LessonPage({ params }) {
  // Static: fetch lesson content at build/ISR time (no auth needed)
  const lesson = await getLesson(params.slug, params.module, params.lesson);
  if (!lesson) notFound();

  return (
    <>
      {/* Static shell — cached at edge */}
      <LessonHeader lesson={lesson} />
      <LessonContent body={lesson.body} />

      {/* Dynamic overlay — client component, fetches auth + progress */}
      <LessonAuthOverlay
        themeSlug={params.slug}
        moduleSlug={params.module}
        lessonSlug={params.lesson}
      />
    </>
  );
}
```

`<LessonAuthOverlay />` is a `"use client"` component that:
1. Checks purchase status via a lightweight `/api/access-check` call
2. Shows paywall modal if unpurchased
3. Checks prerequisite completion
4. Renders progress tracker + "Mark Complete" button

**ISR cache on Fly.io:** Each machine maintains its own ISR file cache. With Cloudflare CDN in front (`s-maxage=3600`), 90%+ of lesson requests hit Cloudflare's shared edge cache. The per-machine ISR cache is a second-level fallback. This is acceptable for content that changes only on deploy.

**If cache consistency becomes an issue:** Add `@neshca/cache-handler-redis` as a custom Next.js cache handler to share ISR cache across all Fly machines via Upstash Redis. This adds ~5ms per cache check but guarantees all machines serve the same ISR generation.

### 3.3 Dynamic Imports for Below-the-Fold

```typescript
// apps/web/app/page.tsx
import dynamic from "next/dynamic";

const FiveWorldsSection = dynamic(
  () => import("./components/five-worlds-section").then(m => m.FiveWorldsSection),
  { ssr: false }
);
const BridgePreviewSection = dynamic(
  () => import("./components/bridge-preview-section").then(m => m.BridgePreviewSection),
  { ssr: false }
);
```

### 3.4 Fly.io Deployment (Next.js)

```toml
# fly.toml (tensorcraft-web)
[build]
  dockerfile = "apps/web/Dockerfile"

[http_service]
  internal_port = 3000
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 2

[[statics]]
  guest_path = "/app/.next/static"
  url_prefix = "/_next/static"
```

Next.js config:
```typescript
// next.config.ts
export default { output: "standalone" };
```

---

## Phase 4: Edge Cache (Week 7–8)

**Goal:** Put a Redis read cache between the API and Postgres for hot data.

### 4.1 Redis Cache Layer

Wrap Supabase queries with a cache-through pattern:

```typescript
async function cachedQuery<T>(key: string, ttlSeconds: number, queryFn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const result = await queryFn();
  await redis.set(key, JSON.stringify(result), { ex: ttlSeconds });
  return result;
}
```

| Data | Cache Key Pattern | TTL | Invalidation |
|------|------------------|-----|-------------|
| Dashboard stats | `dash:{userId}:{themeId}` | 60s | Time-based |
| Purchase status | `purchase:{userId}:{themeSlug}` | 5 min | On webhook (explicit delete) |
| Module completion | `modules:{userId}:{themeId}` | 60s | On lesson complete (explicit delete) |
| Bridge definitions | `bridges:all` | 24h | On deploy |

### 4.2 Read Replica Routing

Use Supabase read replica for non-critical reads:

```typescript
// Heavy analytics queries → read replica
const readClient = getSupabaseServerClient(token, { replica: true });
const { data } = await readClient.from("dashboard_stats").select("*");

// Writes → primary (default)
const writeClient = getSupabaseServerClient(token);
await writeClient.from("theme_progress").upsert({ ... });
```

### 4.3 Cache Invalidation on Writes

When a user completes a lesson or makes a purchase, bust the relevant cache keys:

```typescript
// On lesson complete
await redis.del(`dash:${userId}:${themeId}`);
await redis.del(`modules:${userId}:${themeId}`);

// On purchase webhook
await redis.del(`purchase:${userId}:${themeSlug}`);
```

---

## Phase 5: Background Workers (Week 9–10)

**Goal:** Offload expensive computation from the request path.

### 5.1 Skill Genome Computation (Inngest)

```typescript
// inngest/functions/compute-genome.ts
export const computeGenome = inngest.createFunction(
  { id: "compute-skill-genome" },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    // 1. Find users with new skill_events since last computation
    const users = await step.run("find-active-users", async () => {
      return supabase.from("skill_events")
        .select("user_id")
        .gt("created_at", lastRunTimestamp)
        .then(distinct);
    });

    // 2. Fan out: one computation per user
    for (const userId of users) {
      await step.run(`compute-${userId}`, async () => {
        const events = await supabase.from("skill_events")
          .select("*")
          .eq("user_id", userId)
          .gt("created_at", ninetyDaysAgo)
          .order("created_at", { ascending: false });

        // Weighted decay: recent events count more
        const scores = computeProficiency(events);

        // Upsert into skill_genome
        await supabase.from("skill_genome").upsert(
          scores.map(s => ({ user_id: userId, ...s })),
          { onConflict: "user_id,theme_id,skill_axis" }
        );
      });
    }
  }
);
```

### 5.2 Event Archival (Monthly Cron)

```typescript
export const archiveOldEvents = inngest.createFunction(
  { id: "archive-skill-events" },
  { cron: "0 3 1 * *" }, // 1st of each month at 3 AM
  async ({ step }) => {
    await step.run("archive", async () => {
      // Detach partition older than 90 days
      // Move to archive table or cold storage
      await supabase.rpc("archive_old_skill_events", {
        cutoff: ninetyDaysAgo
      });
    });
  }
);
```

### 5.3 Dashboard Stats Refresh

Already handled by pg_cron (Phase 1.3). Inngest is the fallback if pg_cron is unavailable on Supabase plan:

```typescript
export const refreshDashboardStats = inngest.createFunction(
  { id: "refresh-dashboard-stats" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    await step.run("refresh", async () => {
      await supabase.rpc("refresh_dashboard_stats");
    });
  }
);
```

---

## Cost Projection

| Component | 100K Users | 500K Users | 1M Users |
|-----------|-----------|-----------|---------|
| Fly.io (web, 2–4 machines) | $15/mo | $60/mo | $150/mo |
| Fly.io (API, 3–5 machines) | $15/mo | $75/mo | $200/mo |
| Cloudflare Pro | $20/mo | $20/mo | $20/mo |
| Supabase Pro + Compute + Read Replica | $50/mo | $175/mo | $400/mo |
| Upstash Redis | $10/mo | $60/mo | $200/mo |
| Inngest | Free | $50/mo | $150/mo |
| **Total** | **~$110/mo** | **~$440/mo** | **~$1,120/mo** |

---

## Monitoring & Alerts

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| PgBouncer pool utilization | >80% | >95% |
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
| Phase 3 (Frontend) | 300K | DB read pressure |
| Phase 4 (Edge Cache) | 500K | Background computation |
| Phase 5 (Workers) | 800K–1M | Postgres write throughput |
| Beyond 1M | Requires CQRS or sharding | — |
