import { createHash } from "node:crypto";
import type { Context, Next } from "hono";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";

const WINDOW = "60 s";
const MAX_REQUESTS = 60; // 60 req/min per subject

interface RateLimiterOptions {
  /** Requests allowed per subject per window. */
  max?: number;
  /**
   * Redis key namespace. Distinct prefixes give a route its own budget, so a
   * tight limit on one endpoint can't be exhausted by ordinary traffic
   * elsewhere (and vice versa).
   */
  keyPrefix?: string;
}

/**
 * Limiters backed by @upstash/ratelimit's FIXED window, not sliding: Upstash
 * bills the commands inside an EVAL script, so the SDK's sliding window costs
 * 4 commands per request (same as the old hand-rolled pipeline) while fixed
 * window costs 2 (EVAL+INCR; 3 on a window's first hit). That halves quota
 * burn, the constraint that matters on the free tier's 500K commands/month
 * (2026-08-17 near-exhaustion). Trade-off: a subject straddling a window
 * boundary can briefly reach 2x the limit, acceptable for abuse control.
 * The ephemeral cache serves 429s for already-blocked subjects from process
 * memory at zero Redis cost, so abuse can't burn quota either.
 *
 * One instance per (prefix, max): the SDK binds limit config at construction.
 */
const limiters = new Map<string, Ratelimit>();

function getLimiter(max: number, keyPrefix: string): Ratelimit {
  const cacheKey = `${keyPrefix}:${max}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.fixedWindow(max, WINDOW),
      prefix: keyPrefix,
      ephemeralCache: new Map(),
      // Resolve as allowed if Redis stalls; hard errors fail open below.
      timeout: 2000,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Build a rate limiter middleware for a route-scoped budget.
 * Consistent across all API instances.
 *
 * On Redis failure: allows the request through (graceful degradation).
 * A brief window without rate limiting is better than a total API outage.
 */
export function createRateLimiter({
  max = MAX_REQUESTS,
  keyPrefix = "rl",
}: RateLimiterOptions = {}) {
  return async function rateLimiter(
    c: Context,
    next: Next,
  ): Promise<Response | void> {
    return applyRateLimit(c, next, max, keyPrefix);
  };
}

/** Default limiter: 60 req/min per subject. */
export async function rateLimitMiddleware(
  c: Context,
  next: Next,
): Promise<Response | void> {
  return applyRateLimit(c, next, MAX_REQUESTS, "rl");
}

/**
 * Paths the global limiter skips entirely:
 * - Third-party webhooks: Stripe and Kit retry aggressively; a 429 risks
 *   dropping a retry and desyncing our DB from the provider's state.
 * - /api/health (exact match, liveness only): probed every 10s per machine
 *   by Fly plus every 15s by the Dockerfile HEALTHCHECK. Routing probes
 *   through the limiter burned ~98% of the Upstash free tier's 500K monthly
 *   commands on health checks alone (2026-08-17). The endpoint is static
 *   JSON, so skipping is safe. /api/health/ready is NOT exempt: it queries
 *   Supabase per hit.
 */
function isRateLimitExempt(path: string): boolean {
  return (
    path === "/api/payments/webhook" ||
    path.startsWith("/api/webhooks/") ||
    path === "/api/health"
  );
}

/** Global limiter for index.ts: default limits minus the exempt paths. */
export async function globalRateLimitMiddleware(
  c: Context,
  next: Next,
): Promise<Response | void> {
  if (isRateLimitExempt(c.req.path)) return next();
  return applyRateLimit(c, next, MAX_REQUESTS, "rl");
}

/**
 * Rate-limit key: IDENTITY first, IP second (fresh-eyes rerun T2-28 /
 * irreversible list #5). This middleware runs before auth, so identity is
 * derived from the bearer token itself - a salted-free SHA-256 prefix, never
 * the token - which is stable per session and cannot be spoofed by rotating
 * `cf-connecting-ip` (the recorded bypass: no Fly origin lock, so a direct
 * hit with a rotated header minted unlimited IP buckets). Anonymous traffic
 * still keys on IP; the naive "use c.get('userId')" fix is a no-op here
 * because auth has not run yet.
 */
function rateLimitSubject(c: Context): string {
  const auth = c.req.header("authorization");
  if (auth?.startsWith("Bearer ") && auth.length > 24) {
    return `t:${createHash("sha256").update(auth.slice(7)).digest("hex").slice(0, 16)}`;
  }
  const ip =
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",").pop()?.trim() ||
    "unknown";
  return `ip:${ip}`;
}

async function applyRateLimit(
  c: Context,
  next: Next,
  maxRequests: number,
  keyPrefix: string,
): Promise<Response | void> {
  const subject = rateLimitSubject(c);

  try {
    const { success, remaining, reset } = await getLimiter(
      maxRequests,
      keyPrefix,
    ).limit(subject);

    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));

    if (!success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((reset - Date.now()) / 1000),
      );
      c.header("Retry-After", String(retryAfterSeconds));
      return c.json(
        { error: "Too many requests. Please try again later." },
        429,
      );
    }
  } catch {
    // Redis unavailable, allow request through (graceful degradation).
    // Log for monitoring but don't block the user.
    logger.warn("Rate limiter: Redis unavailable, allowing request through");
  }

  return next();
}
