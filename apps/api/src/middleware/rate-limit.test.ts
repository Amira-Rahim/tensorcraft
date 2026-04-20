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
const { rateLimitMiddleware } = await import("./rate-limit");

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
