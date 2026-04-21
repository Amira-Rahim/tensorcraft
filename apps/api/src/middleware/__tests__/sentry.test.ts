import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Capture scope mutations so we can assert on the tags sentryMiddleware sets.
const scopeMock = {
  setTag: vi.fn(),
};

const captureExceptionMock = vi.fn();

vi.mock("@sentry/node", () => {
  return {
    withScope: (fn: (scope: typeof scopeMock) => unknown) => fn(scopeMock),
    captureException: (...args: unknown[]) => captureExceptionMock(...args),
  };
});

import { sentryMiddleware } from "../sentry";

describe("sentryMiddleware", () => {
  beforeEach(() => {
    scopeMock.setTag.mockReset();
    captureExceptionMock.mockReset();
  });

  it("tags the scope with requestId, route, and method", async () => {
    const app = new Hono();
    app.use("*", sentryMiddleware);
    app.get("/hello", (c) => c.json({ ok: true }));

    const res = await app.request("/hello", {
      method: "GET",
      headers: { "x-request-id": "req_abc_123" },
    });

    expect(res.status).toBe(200);
    expect(scopeMock.setTag).toHaveBeenCalledWith("requestId", "req_abc_123");
    expect(scopeMock.setTag).toHaveBeenCalledWith("route", "/hello");
    expect(scopeMock.setTag).toHaveBeenCalledWith("method", "GET");
  });

  it("tags errors with requestId + route when the onError handler captures them", async () => {
    // Mirrors the onError in apps/api/src/index.ts — the middleware sets the
    // scope, and the app-level onError calls Sentry.captureException with the
    // correlation tags. This is the real runtime flow (Hono re-dispatches
    // errors to onError rather than unwinding them through middleware).
    const app = new Hono();
    app.use("*", sentryMiddleware);
    app.get("/boom", () => {
      throw new Error("kaboom");
    });
    app.onError(async (err, c) => {
      const Sentry = await import("@sentry/node");
      const requestId =
        c.res.headers.get("X-Request-Id") ??
        c.req.header("X-Request-Id") ??
        "unknown";
      Sentry.captureException(err, {
        tags: {
          requestId,
          route: c.req.path,
          method: c.req.method,
        },
      });
      return c.json({ error: "internal" }, 500);
    });

    const res = await app.request("/boom", {
      method: "GET",
      headers: { "x-request-id": "req_boom" },
    });

    expect(res.status).toBe(500);
    expect(scopeMock.setTag).toHaveBeenCalledWith("requestId", "req_boom");
    expect(scopeMock.setTag).toHaveBeenCalledWith("route", "/boom");
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [err, context] = captureExceptionMock.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("kaboom");
    expect(context).toMatchObject({
      tags: {
        requestId: "req_boom",
        route: "/boom",
        method: "GET",
      },
    });
  });

  it("still tags route/method when no requestId header is present", async () => {
    const app = new Hono();
    app.use("*", sentryMiddleware);
    app.get("/no-id", (c) => c.json({ ok: true }));

    await app.request("/no-id");

    const tagKeys = scopeMock.setTag.mock.calls.map((call) => call[0]);
    expect(tagKeys).toContain("route");
    expect(tagKeys).toContain("method");
  });
});
