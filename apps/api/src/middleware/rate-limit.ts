import type { Context, Next } from "hono";
import { getRedis } from "../lib/redis";
import type { AppEnv } from "../types";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

/**
 * Sliding-window rate limiter backed by Upstash Redis.
 * Consistent across all API instances. No in-memory fallback —
 * Redis is mandatory for production deployments.
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
  c.header(
    "X-RateLimit-Remaining",
    String(Math.max(0, MAX_REQUESTS - requestCount)),
  );

  if (requestCount > MAX_REQUESTS) {
    c.header("Retry-After", "60");
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  return next();
}
