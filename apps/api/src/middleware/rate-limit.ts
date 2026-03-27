import type { Context, Next } from "hono";
import { getRedis } from "../lib/redis";
import type { AppEnv } from "../types";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 120; // 120 req/min per IP (allows multi-tab usage)

/**
 * Sliding-window rate limiter backed by Upstash Redis.
 * Consistent across all API instances.
 *
 * On Redis failure: allows the request through (graceful degradation).
 * A brief window without rate limiting is better than a total API outage.
 */
export async function rateLimitMiddleware(
  c: Context<AppEnv>,
  next: Next,
): Promise<Response | void> {
  const ip =
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",").pop()?.trim() ||
    "unknown";

  try {
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
    c.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, MAX_REQUESTS - requestCount)),
    );

    if (requestCount > MAX_REQUESTS) {
      c.header("Retry-After", "60");
      return c.json(
        { error: "Too many requests. Please try again later." },
        429,
      );
    }
  } catch {
    // Redis unavailable — allow request through (graceful degradation).
    // Log for monitoring but don't block the user.
    console.warn("Rate limiter: Redis unavailable, allowing request through");
  }

  return next();
}
