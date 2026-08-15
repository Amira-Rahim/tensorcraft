import { createHash } from "node:crypto";
import type { Context, Next } from "hono";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // 60 req/min per IP

interface RateLimiterOptions {
  /** Requests allowed per IP per window. */
  max?: number;
  /**
   * Redis key namespace. Distinct prefixes give a route its own budget, so a
   * tight limit on one endpoint can't be exhausted by ordinary traffic
   * elsewhere (and vice versa).
   */
  keyPrefix?: string;
}

/**
 * Build a sliding-window rate limiter backed by Upstash Redis.
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

/** Default limiter: 60 req/min per IP, applied globally except to webhooks. */
export async function rateLimitMiddleware(
  c: Context,
  next: Next,
): Promise<Response | void> {
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
    const redis = getRedis();
    const key = `${keyPrefix}:${subject}`;
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

    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, maxRequests - requestCount)),
    );

    if (requestCount > maxRequests) {
      c.header("Retry-After", "60");
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
