import type { Context, Next } from "hono";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 req/min per IP

/* ── Redis adapter (Upstash REST API) ──────────────────────────────── */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisIncr(
  key: string,
): Promise<{ count: number; ttl: number } | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;

  try {
    // INCR + conditional EXPIRE via pipeline
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["TTL", key],
      ]),
    });

    if (!res.ok) return null;

    const results = (await res.json()) as { result: number }[];
    const count = results[0].result;
    const ttl = results[1].result;

    // Set expiry on first request (ttl === -1 means no expiry set)
    if (ttl === -1) {
      await fetch(`${REDIS_URL}/expire/${encodeURIComponent(key)}/60`, {
        method: "POST",
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      });
    }

    return { count, ttl: ttl > 0 ? ttl : 60 };
  } catch (err) {
    console.error(
      "Rate limiter Redis error:",
      err instanceof Error ? err.message : err,
    );
    return null; // Fall back to in-memory
  }
}

/* ── In-memory fallback ────────────────────────────────────────────── */

const requests = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL_MS = 60 * 1000;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now > entry.resetAt) {
      requests.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

cleanupTimer.unref();

function inMemoryIncr(ip: string): { count: number; resetInSec: number } {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { count: 1, resetInSec: Math.ceil(WINDOW_MS / 1000) };
  }

  entry.count++;
  return {
    count: entry.count,
    resetInSec: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/* ── Middleware ─────────────────────────────────────────────────────── */

export async function rateLimitMiddleware(c: Context, next: Next) {
  // Use cf-connecting-ip (Cloudflare) or last IP in x-forwarded-for (reverse proxy)
  // to prevent client-side IP spoofing via the first entry
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";

  // Try Redis first, fall back to in-memory
  const redisKey = `rl:${ip}`;
  const redisResult = await redisIncr(redisKey);

  if (redisResult) {
    if (redisResult.count > MAX_REQUESTS) {
      c.header("Retry-After", String(redisResult.ttl));
      return c.json({ error: "Too many requests" }, 429);
    }
    await next();
    return;
  }

  // In-memory fallback
  const { count, resetInSec } = inMemoryIncr(ip);

  if (count > MAX_REQUESTS) {
    c.header("Retry-After", String(resetInSec));
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
}
