import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { versionMiddleware, API_VERSION } from "../version";

describe("versionMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", versionMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("sets X-API-Version header on every response", async () => {
    const res = await app.request("/test");
    expect(res.headers.get("X-API-Version")).toBe(API_VERSION);
  });

  it("uses the exported API_VERSION constant", async () => {
    expect(API_VERSION).toBe("v1");
    const res = await app.request("/test");
    expect(res.headers.get("X-API-Version")).toBe("v1");
  });

  it("sets the header even on non-existent routes", async () => {
    const res = await app.request("/does-not-exist");
    // Hono 404 still passes through global middleware
    expect(res.headers.get("X-API-Version")).toBe(API_VERSION);
  });
});
