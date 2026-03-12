import type { Context, Next } from "hono";

/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-backed solution.
 */
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 req/min per IP

/** Periodically purge expired entries to prevent unbounded memory growth. */
const CLEANUP_INTERVAL_MS = 60 * 1000; // every 60s

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now > entry.resetAt) {
      requests.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Allow the process to exit even if the timer is still active
cleanupTimer.unref();

export async function rateLimitMiddleware(c: Context, next: Next) {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    c.header("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
}
