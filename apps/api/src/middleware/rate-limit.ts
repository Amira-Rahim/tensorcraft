import type { Context, Next } from "hono";

/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-backed solution.
 */
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 req/min per IP

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
