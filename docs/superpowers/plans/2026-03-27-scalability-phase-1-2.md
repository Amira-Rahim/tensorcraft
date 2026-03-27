# Scalability Phase 1-2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix database bottlenecks and make the API horizontally scalable — unlocking 200K user capacity.

**Architecture:** Add missing Postgres indexes, materialized view for dashboard, advisory lock on streaks, partitioned skill_events table. Switch API rate limiting to mandatory Redis, add JWT caching, batch skill events endpoint, and prepare Dockerfiles for Fly.io deployment.

**Tech Stack:** Supabase Postgres (migrations), Upstash Redis SDK (`@upstash/redis`), Hono middleware, Next.js (standalone output), Docker

**Spec:** `docs/superpowers/specs/2026-03-27-scalability-design.md`

---

## File Map

### New Files
- `packages/supabase/migrations/012_scalability_indexes.sql` — Missing indexes + materialized view + streak fix
- `packages/supabase/migrations/013_skill_events_partitioning.sql` — Partitioned table migration
- `apps/api/src/lib/redis.ts` — Upstash Redis client singleton
- `apps/api/src/lib/cache.ts` — Generic cache-through helper
- `apps/api/Dockerfile` — Multi-stage Docker build for Hono API
- `apps/api/fly.toml` — Fly.io deployment config for API
- `apps/web/Dockerfile` — Multi-stage Docker build for Next.js standalone
- `apps/web/fly.toml` — Fly.io deployment config for web
- `docs/infrastructure.md` — Infrastructure documentation

### Modified Files
- `apps/api/package.json` — Add `@upstash/redis` dependency
- `apps/api/src/middleware/rate-limit.ts` — Replace in-memory with mandatory Redis
- `apps/api/src/middleware/auth.ts` — Add JWT caching via Redis
- `apps/api/src/routes/skill-events.ts` — Add batch endpoint
- `apps/api/.env.example` — Update env var names for Upstash SDK
- `apps/web/lib/progress-client.ts` — Buffer skill events client-side
- `apps/web/next.config.ts` — Add `output: "standalone"`
- `packages/supabase/src/types.ts` — Add dashboard_stats view type
- `docs/dev-plan.md` — Update with scalability status

---

## Task 1: Database Indexes + Materialized View + Streak Fix

**Files:**
- Create: `packages/supabase/migrations/012_scalability_indexes.sql`
- Modify: `packages/supabase/src/types.ts`

- [ ] **Step 1: Write migration 012**

```sql
-- Tensorcraft: Scalability Phase 1 — Indexes, Materialized View, Streak Fix
--
-- Adds missing indexes for dashboard/exercise queries at scale.
-- Creates materialized view for dashboard aggregation.
-- Fixes streak race condition with advisory lock.

-- ============================================================
-- MISSING INDEXES
-- ============================================================

-- Exercise attempts: dashboard sorts by date per theme
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_theme_date
  ON exercise_attempts(theme_id, attempted_at DESC);

-- Skill events: genome computation reads recent events per user
CREATE INDEX IF NOT EXISTS idx_skill_events_user_created
  ON skill_events(user_id, created_at DESC);

-- Theme progress: prerequisite checks filter by completed status
CREATE INDEX IF NOT EXISTS idx_theme_progress_completed
  ON theme_progress(user_id, theme_id, status)
  WHERE status = 'completed';

-- ============================================================
-- MATERIALIZED VIEW: Dashboard Stats
-- Replaces 4 parallel queries + in-memory aggregation.
-- Total lessons is a content-layer constant (55 per theme).
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT
  user_id,
  theme_id,
  55 AS total_lessons,
  count(*) FILTER (WHERE status = 'completed') AS completed_lessons,
  count(*) FILTER (WHERE status = 'in_progress') AS in_progress_lessons,
  round(
    count(*) FILTER (WHERE status = 'completed')::numeric / 55.0 * 100, 1
  ) AS completion_pct,
  max(completed_at) AS last_activity
FROM theme_progress
GROUP BY user_id, theme_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user_theme
  ON dashboard_stats(user_id, theme_id);

-- First refresh must omit CONCURRENTLY (Postgres requirement)
REFRESH MATERIALIZED VIEW dashboard_stats;

-- ============================================================
-- STREAK RACE CONDITION FIX
-- Add advisory lock to prevent duplicate increments under
-- concurrent calls for the same user+theme.
-- Two-argument form gives 64-bit address space.
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_streak_activity(p_theme_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_existing record;
  v_new_streak integer;
  v_new_longest integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Advisory lock prevents concurrent calls for same user+theme
  PERFORM pg_advisory_xact_lock(
    hashtext(v_user_id::text),
    hashtext(p_theme_id)
  );

  SELECT current_streak, longest_streak, last_activity_date
  INTO v_existing
  FROM public.streaks
  WHERE user_id = v_user_id AND theme_id = p_theme_id;

  -- No row yet — create one
  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, theme_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_user_id, p_theme_id, 1, 1, v_today);
    RETURN;
  END IF;

  -- Already recorded today — no-op
  IF v_existing.last_activity_date = v_today THEN
    RETURN;
  END IF;

  -- Consecutive day — increment streak
  IF v_existing.last_activity_date = v_today - 1 THEN
    v_new_streak := v_existing.current_streak + 1;
  ELSE
    -- Streak broken — reset to 1
    v_new_streak := 1;
  END IF;

  v_new_longest := GREATEST(v_existing.longest_streak, v_new_streak);

  UPDATE public.streaks
  SET current_streak = v_new_streak,
      longest_streak = v_new_longest,
      last_activity_date = v_today
  WHERE user_id = v_user_id AND theme_id = p_theme_id;
END;
$$;
```

**Note on recurring refresh:** The migration only does the initial `REFRESH MATERIALIZED VIEW dashboard_stats`. The recurring 5-minute refresh via `pg_cron` must be set up manually in the Supabase SQL editor (pg_cron is available on Pro plans), or deferred to Phase 5 when Inngest workers are added. Until then, the view is populated once on migration and becomes stale as users progress.

- [ ] **Step 2: Add dashboard_stats to types.ts**

In `packages/supabase/src/types.ts`, the `Views` section already has `theme_progress_summary`. Add `dashboard_stats` alongside it:

```typescript
// Add inside Views block, after theme_progress_summary
dashboard_stats: {
  Row: {
    user_id: string;
    theme_id: string;
    total_lessons: number;
    completed_lessons: number;
    in_progress_lessons: number;
    completion_pct: number | null;
    last_activity: string | null;
  };
  Relationships: [];
};
```

- [ ] **Step 3: Verify migration runs cleanly**

Run: `cat packages/supabase/migrations/012_scalability_indexes.sql | head -5`
Expected: File exists with correct header comment.

- [ ] **Step 4: Commit**

```bash
git add packages/supabase/migrations/012_scalability_indexes.sql packages/supabase/src/types.ts
git commit -m "feat(db): add scalability indexes, dashboard materialized view, streak advisory lock"
```

---

## Task 2: skill_events Table Partitioning

**Files:**
- Create: `packages/supabase/migrations/013_skill_events_partitioning.sql`

- [ ] **Step 1: Write migration 013**

```sql
-- Tensorcraft: Scalability Phase 1 — skill_events Partitioning
--
-- Converts skill_events to a monthly-partitioned table.
-- Requires brief write pause during the atomic swap.
-- Creates 6 months of partitions (March–August 2026).
--
-- NOTE: Run this migration during a maintenance window.
-- The swap (Step 6) acquires an ACCESS EXCLUSIVE lock briefly.

-- Step 1: Create new partitioned table
-- NOTE: Postgres requires the partition key (created_at) in the PRIMARY KEY.
-- No other table references skill_events.id, so this shape change is safe.
CREATE TABLE public.skill_events_new (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'exercise_pass','exercise_fail','hint_reveal','solution_view',
    'lesson_complete','bridge_interaction','review_recall'
  )),
  skill_axis text NOT NULL CHECK (skill_axis IN (
    'data_prep','model_arch','training','evaluation','deployment','fe_integration'
  )),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Step 2: Create monthly partitions (catch-all for pre-March + 6 months ahead)
-- Catch-all for any data before March 2026 (prevents INSERT failure)
CREATE TABLE public.skill_events_before_2026_03 PARTITION OF public.skill_events_new
  FOR VALUES FROM (MINVALUE) TO ('2026-03-01');
CREATE TABLE public.skill_events_2026_03 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.skill_events_2026_04 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.skill_events_2026_05 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.skill_events_2026_06 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.skill_events_2026_07 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.skill_events_2026_08 PARTITION OF public.skill_events_new
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- Step 3: Copy existing data
INSERT INTO public.skill_events_new
  SELECT * FROM public.skill_events;

-- Step 4: Recreate RLS
ALTER TABLE public.skill_events_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events"
  ON public.skill_events_new FOR SELECT
  USING (auth.uid() = user_id);

-- Step 5: Recreate indexes (auto-created per partition)
CREATE INDEX ON public.skill_events_new(user_id);
CREATE INDEX ON public.skill_events_new(user_id, theme_id);
CREATE INDEX ON public.skill_events_new(user_id, created_at DESC);

-- Step 6: Atomic swap
ALTER TABLE public.skill_events RENAME TO skill_events_old;
ALTER TABLE public.skill_events_new RENAME TO skill_events;

-- Step 7: Drop old table (run manually after verification)
-- DROP TABLE public.skill_events_old;
```

- [ ] **Step 2: Commit**

```bash
git add packages/supabase/migrations/013_skill_events_partitioning.sql
git commit -m "feat(db): partition skill_events by month for scalability"
```

---

## Task 3: Redis Client Singleton + Cache Helper

**Files:**
- Create: `apps/api/src/lib/redis.ts`
- Create: `apps/api/src/lib/cache.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Add @upstash/redis dependency**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && pnpm add @upstash/redis --filter @tensorcraft/api`

- [ ] **Step 2: Create Redis client singleton**

```typescript
// apps/api/src/lib/redis.ts
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required. " +
        "See apps/api/.env.example"
    );
  }

  redis = new Redis({ url, token });
  return redis;
}
```

- [ ] **Step 3: Create cache-through helper**

```typescript
// apps/api/src/lib/cache.ts
import { getRedis } from "./redis";

/**
 * Cache-through query helper. Checks Redis first, falls back to queryFn,
 * stores result in Redis with TTL.
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  queryFn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const result = await queryFn();
  await redis.set(key, result, { ex: ttlSeconds });
  return result;
}

/** Bust a specific cache key */
export async function bustCache(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}

/** Bust multiple cache keys */
export async function bustCacheKeys(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/lib/redis.ts apps/api/src/lib/cache.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add Upstash Redis client singleton and cache-through helper"
```

---

## Task 4: Mandatory Redis Rate Limiting

**Files:**
- Modify: `apps/api/src/middleware/rate-limit.ts`

- [ ] **Step 1: Replace rate limiter with Redis-backed implementation**

Replace the entire file:

```typescript
// apps/api/src/middleware/rate-limit.ts
import type { Context, Next } from "hono";
import { getRedis } from "../lib/redis";
import type { AppEnv } from "../types";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

/**
 * Sliding-window rate limiter backed by Upstash Redis.
 * Consistent across all API instances.
 */
export async function rateLimitMiddleware(
  c: Context<AppEnv>,
  next: Next,
): Promise<Response | void> {
  const ip =
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",").pop()?.trim() ||
    "unknown";

  const redis = getRedis();
  const key = `rl:${ip}`;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Sliding window: remove old entries, add current, count
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  pipeline.zcard(key);
  pipeline.expire(key, 120); // 2-minute TTL (covers the window + buffer)

  const results = await pipeline.exec();
  const requestCount = results[2] as number;

  c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
  c.header("X-RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - requestCount)));

  if (requestCount > MAX_REQUESTS) {
    c.header("Retry-After", "60");
    return c.json(
      { error: "Too many requests. Please try again later." },
      429,
    );
  }

  return next();
}
```

- [ ] **Step 2: Commit**

- [ ] **Step 3: Update rate-limit tests if they exist**

Check if `apps/api/src/middleware/rate-limit.test.ts` exists. If so, update tests to mock `@upstash/redis` instead of the old REST API / in-memory behavior. The new implementation uses `redis.pipeline()` with `zremrangebyscore`, `zadd`, `zcard`, `expire`. Tests should mock the pipeline response.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/middleware/rate-limit.ts apps/api/src/middleware/rate-limit.test.ts
git commit -m "feat(api): replace in-memory rate limiter with mandatory Redis sliding window"
```

---

## Task 5: JWT Token Caching

**Files:**
- Modify: `apps/api/src/middleware/auth.ts`

- [ ] **Step 1: Read the current auth middleware**

Read: `apps/api/src/middleware/auth.ts` — understand current flow before modifying.

- [ ] **Step 2: Add Redis JWT caching**

Replace the entire file:

```typescript
// apps/api/src/middleware/auth.ts
import type { Context, Next } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { getRedis } from "../lib/redis";
import type { AppEnv } from "../types";

const JWT_CACHE_TTL = 30; // seconds

import { createHash } from "node:crypto";

/** Hash a token for use as a Redis key (SHA-256 — collision-safe at 1M+ users) */
function hashToken(token: string): string {
  return `jwt:${createHash("sha256").update(token).digest("hex").slice(0, 32)}`;
}

export async function authMiddleware(
  c: Context<AppEnv>,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  if (!token) {
    return c.json({ error: "Empty bearer token" }, 401);
  }

  // Check Redis cache first
  const cacheKey = hashToken(token);
  try {
    const redis = getRedis();
    const cached = await redis.get<{ userId: string }>(cacheKey);
    if (cached?.userId) {
      c.set("userId", cached.userId);
      c.set("accessToken", token);
      return next();
    }
  } catch {
    // Redis failure is non-fatal — fall through to Supabase validation
  }

  // Validate with Supabase
  const supabase = getSupabaseServerClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  // Cache validated claims
  try {
    const redis = getRedis();
    await redis.set(cacheKey, { userId: user.id }, { ex: JWT_CACHE_TTL });
  } catch {
    // Cache write failure is non-fatal
  }

  c.set("userId", user.id);
  c.set("accessToken", token);
  return next();
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/middleware/auth.ts
git commit -m "feat(api): add Redis JWT caching (30s TTL) to auth middleware"
```

---

## Task 6: Batch Skill Events Endpoint + Client Buffering

**Files:**
- Modify: `apps/api/src/routes/skill-events.ts`
- Modify: `apps/web/lib/progress-client.ts`

- [ ] **Step 1: Add batch endpoint to skill-events route**

Read `apps/api/src/routes/skill-events.ts` first, then add the batch endpoint after the existing single endpoint. Add the `VALID_EVENT_TYPES` and `VALID_AXES` sets at the top of the file (extract from existing single-event validation), then add:

```typescript
/**
 * POST /api/skill-events/batch — Record multiple skill events in one request.
 * Client buffers events and flushes periodically to reduce DB pressure.
 */
skillEvents.post("/batch", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: { events: Array<{ themeId: string; eventType: string; skillAxis: string; metadata?: Record<string, unknown> }> };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { events } = body;

  if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
    return c.json({ error: "events must be an array of 1-50 items" }, 400);
  }

  for (const e of events) {
    if (!e.themeId || !isValidThemeSlug(e.themeId)) {
      return c.json({ error: `Invalid themeId: ${e.themeId}` }, 400);
    }
    // Uses .includes() to match existing code pattern (arrays, not Sets)
    if (!VALID_EVENT_TYPES.includes(e.eventType)) {
      return c.json({ error: `Invalid eventType: ${e.eventType}` }, 400);
    }
    if (!VALID_SKILL_AXES.includes(e.skillAxis)) {
      return c.json({ error: `Invalid skillAxis: ${e.skillAxis}` }, 400);
    }
  }

  const supabase = getSupabaseServerClient(token);
  const { error } = await supabase.from("skill_events").insert(
    events.map((e) => ({
      user_id: userId,
      theme_id: e.themeId,
      event_type: e.eventType,
      skill_axis: e.skillAxis,
      metadata: e.metadata ?? {},
    })),
  );

  if (error) {
    console.error("Failed to batch insert skill events:", error);
    return c.json({ error: "Failed to record events" }, 500);
  }

  return c.json({ recorded: events.length }, 201);
});
```

- [ ] **Step 2: Add client-side event buffering**

In `apps/web/lib/progress-client.ts`, replace the `emitSkillEvent` function with a buffered version:

```typescript
/** ── Skill Event Buffer ────────────────────────────── */

interface BufferedEvent {
  themeId: string;
  eventType: string;
  skillAxis: string;
  metadata: Record<string, unknown>;
}

let eventBuffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER_SIZE = 50;

async function flushEventBuffer() {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer = [];

  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // keepalive: true ensures the request survives page navigation/unload
  fetch(`${apiBase}/api/skill-events/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {
    // Silently fail — skill events are non-critical
  });
}

// Flush on page visibility change (user navigating away)
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEventBuffer();
    }
  });
}

/** Emit a skill event — buffered, flushed every 5s or on page leave */
export function emitSkillEvent(
  themeId: string,
  eventType: string,
  skillAxis: string | undefined,
  metadata: Record<string, unknown> = {},
) {
  if (!skillAxis) return;

  eventBuffer.push({ themeId, eventType, skillAxis, metadata });

  // Flush immediately if buffer is full
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushEventBuffer();
    return;
  }

  // Schedule flush
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushEventBuffer();
    }, FLUSH_INTERVAL_MS);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/skill-events.ts apps/web/lib/progress-client.ts
git commit -m "feat: add batch skill events endpoint + client-side event buffering"
```

---

## Task 7: Dockerfiles + Fly.io Configuration

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/fly.toml`
- Create: `apps/web/Dockerfile`
- Create: `apps/web/fly.toml`
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Create API Dockerfile**

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/supabase/package.json packages/supabase/
COPY packages/shared/package.json packages/shared/
COPY packages/github/package.json packages/github/
RUN pnpm install --frozen-lockfile --filter @tensorcraft/api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter @tensorcraft/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Create API fly.toml**

```toml
# apps/api/fly.toml
app = "tensorcraft-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true
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

- [ ] **Step 3: Add standalone output to Next.js config**

Read `apps/web/next.config.ts`, then add `output: "standalone"` to the config object.

- [ ] **Step 4: Create Web Dockerfile**

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/supabase/package.json packages/supabase/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/themes/package.json packages/themes/
COPY packages/content/package.json packages/content/
COPY packages/config/package.json packages/config/
COPY packages/github/package.json packages/github/
RUN pnpm install --frozen-lockfile --filter @tensorcraft/web...

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @tensorcraft/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 5: Create Web fly.toml**

```toml
# apps/web/fly.toml
app = "tensorcraft-web"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 2

[[statics]]
  guest_path = "/app/apps/web/.next/static"
  url_prefix = "/_next/static"
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/Dockerfile apps/api/fly.toml apps/web/Dockerfile apps/web/fly.toml apps/web/next.config.ts
git commit -m "feat: add Dockerfiles and Fly.io configs for API and web"
```

---

## Task 8: Update .env.example Files

**Files:**
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Update API .env.example**

Add clarity that Redis is now mandatory:

```bash
# Required: Upstash Redis (mandatory for rate limiting + JWT cache)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/.env.example
git commit -m "docs: update .env.example with mandatory Redis config"
```

---

## Task 9: Infrastructure Documentation

**Files:**
- Create: `docs/infrastructure.md`
- Modify: `docs/dev-plan.md`

- [ ] **Step 1: Write infrastructure docs**

Create `docs/infrastructure.md` documenting the deployment topology, Fly.io setup, Cloudflare configuration, Redis requirements, database scaling changes, and monitoring thresholds. Include the full deployment topology diagram, cost projections, and capacity ceiling table from the spec.

Key sections:
1. Deployment Topology (diagram)
2. Fly.io Services (web + API configs)
3. Cloudflare CDN Rules
4. Supabase Configuration (Supavisor pooling, read replica)
5. Upstash Redis (rate limiting, JWT cache, query cache)
6. Database Migrations (012 indexes + view, 013 partitioning)
7. Cost Projection Table
8. Monitoring & Alert Thresholds
9. Capacity Ceiling by Phase

- [ ] **Step 2: Update dev-plan.md**

Add a new section to `docs/dev-plan.md` after Phase 6:

```markdown
## Phase 7b: Scalability Infrastructure

> See `docs/infrastructure.md` for full deployment architecture and `docs/superpowers/specs/2026-03-27-scalability-design.md` for the design spec.

- [x] Migration 012: Missing indexes (exercise_attempts, skill_events, theme_progress)
- [x] Migration 012: Materialized view `dashboard_stats` for aggregated progress
- [x] Migration 012: Streak advisory lock race condition fix
- [x] Migration 013: skill_events monthly partitioning
- [x] Upstash Redis client singleton + cache-through helper
- [x] Mandatory Redis rate limiting (removed in-memory fallback)
- [x] JWT token caching (30s TTL via Redis)
- [x] Batch skill events endpoint + client-side event buffering
- [x] Dockerfiles for API and web (Fly.io deployment-ready)
- [x] Fly.io configs (fly.toml) for both services
- [ ] Phase 3: ISR lesson pages + SWR dashboard (Week 5-6)
- [ ] Phase 4: Redis cache layer + read replica routing (Week 7-8)
- [ ] Phase 5: Inngest background workers (Week 9-10)
```

- [ ] **Step 3: Commit**

```bash
git add docs/infrastructure.md docs/dev-plan.md
git commit -m "docs: add infrastructure documentation and update dev-plan with scalability status"
```

---

## Task 10: Verify Everything Builds

- [ ] **Step 1: Run typecheck**

Run: `pnpm turbo typecheck`
Expected: No type errors. The new `dashboard_stats` view type and Redis imports should compile.

- [ ] **Step 2: Run lint**

Run: `pnpm turbo lint`
Expected: No new lint errors.

- [ ] **Step 3: Run tests if they exist**

Run: `pnpm turbo test`
Expected: All existing tests pass. New code doesn't break anything.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address typecheck/lint issues from scalability changes"
```
