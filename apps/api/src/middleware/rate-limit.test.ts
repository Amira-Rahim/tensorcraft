import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";

/**
 * Hand-rolled in-memory mock of the Upstash Redis client surface the
 * rate-limit middleware uses. Backed by a plain `Map<string, Array<{score,member}>>`
 * so we can exercise the sliding-window limit without external deps.
 *
 * Supported operations (enough for rate-limit.ts' pipeline):
 *   - pipeline()
 *       .zremrangebyscore(key, min, max)
 *       .zadd(key, { score, member })
 *       .zcard(key)
 *       .expire(key, seconds)
 *       .exec()  -> returns [null, null, count, null]
 */
type ZMember = { score: number; member: string };
const store = new Map<string, ZMember[]>();

function makePipeline() {
  const ops: Array<() => unknown> = [];
  const api = {
    zremrangebyscore(key: string, min: number, max: number) {
      ops.push(() => {
        const arr = store.get(key) ?? [];
        const kept = arr.filter((e) => e.score < min || e.score > max);
        store.set(key, kept);
        return null;
      });
      return api;
    },
    zadd(key: string, entry: { score: number; member: string }) {
      ops.push(() => {
        const arr = store.get(key) ?? [];
        arr.push(entry);
        store.set(key, arr);
        return null;
      });
      return api;
    },
    zcard(key: string) {
      ops.push(() => (store.get(key) ?? []).length);
      return api;
    },
    expire(_key: string, _seconds: number) {
      ops.push(() => null);
      return api;
    },
    async exec() {
      return ops.map((op) => op());
    },
  };
  return api;
}

vi.mock("../lib/redis", () => ({
  getRedis: () => ({
    pipeline: () => makePipeline(),
  }),
}));

// Import AFTER vi.mock so the middleware picks up the mocked getRedis.
const { rateLimitMiddleware, globalRateLimitMiddleware } =
  await import("./rate-limit");

describe("rateLimitMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    store.clear();
    app = new Hono();
    app.use("*", rateLimitMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("allows requests under the limit", async () => {
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    expect(res.status).toBe(200);
  });

  it("returns 429 when rate limit exceeded", async () => {
    // Use a unique IP for this test
    const ip = `rate-limit-test-${Date.now()}`;
    const headers = { "x-forwarded-for": ip };

    // Send 61 requests (limit is 60)
    for (let i = 0; i < 60; i++) {
      await app.request("/test", { headers });
    }

    const res = await app.request("/test", { headers });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });
});

describe("globalRateLimitMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    store.clear();
    app = new Hono();
    app.use("*", globalRateLimitMiddleware);
    app.get("/api/health", (c) => c.json({ status: "ok" }));
    app.get("/api/health/ready", (c) => c.json({ status: "ok" }));
    app.post("/api/payments/webhook", (c) => c.json({ received: true }));
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("exempts /api/health without touching Redis", async () => {
    const res = await app.request("/api/health", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(res.status).toBe(200);
    // Limiter never ran: no headers set, no Redis commands issued.
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    expect(store.size).toBe(0);
  });

  it("still rate limits /api/health/ready (it queries the DB)", async () => {
    const res = await app.request("/api/health/ready", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(store.size).toBe(1);
  });

  it("exempts webhook paths without touching Redis", async () => {
    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.3" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    expect(store.size).toBe(0);
  });

  it("rate limits ordinary routes", async () => {
    const headers = { "x-forwarded-for": "10.0.0.4" };
    for (let i = 0; i < 60; i++) {
      await app.request("/test", { headers });
    }
    const res = await app.request("/test", { headers });
    expect(res.status).toBe(429);
  });
});
