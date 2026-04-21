import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { requestIdMiddleware } from "../request-id";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("requestIdMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", requestIdMiddleware);
    app.get("/test", (c) => c.json({ requestId: c.get("requestId") }));
  });

  it("sets X-Request-Id header matching UUID pattern", async () => {
    const res = await app.request("/test");
    const requestId = res.headers.get("X-Request-Id");
    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(UUID_REGEX);
  });

  it("generates a unique request ID per request", async () => {
    const res1 = await app.request("/test");
    const res2 = await app.request("/test");
    expect(res1.headers.get("X-Request-Id")).not.toBe(
      res2.headers.get("X-Request-Id"),
    );
  });

  it("exposes requestId on the Hono context", async () => {
    const res = await app.request("/test");
    const body = (await res.json()) as { requestId: string };
    expect(body.requestId).toMatch(UUID_REGEX);
    expect(res.headers.get("X-Request-Id")).toBe(body.requestId);
  });

  it("honors an incoming X-Request-Id header when it looks like a trace id", async () => {
    const upstream = "11111111-2222-3333-4444-555555555555";
    const res = await app.request("/test", {
      headers: { "x-request-id": upstream },
    });
    expect(res.headers.get("X-Request-Id")).toBe(upstream);
  });

  it("rejects malformed incoming X-Request-Id and mints a fresh UUID", async () => {
    const res = await app.request("/test", {
      headers: { "x-request-id": "not a uuid; drop table users;" },
    });
    expect(res.headers.get("X-Request-Id")).toMatch(UUID_REGEX);
  });

  it("exposes a child logger on the context", async () => {
    let captured: unknown;
    const testApp = new Hono();
    testApp.use("*", requestIdMiddleware);
    testApp.get("/check", (c) => {
      captured = c.get("logger");
      return c.json({ ok: true });
    });
    await testApp.request("/check");
    expect(captured).toBeDefined();
    expect(typeof (captured as { info: unknown }).info).toBe("function");
  });
});
