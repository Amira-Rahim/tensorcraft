import type { Context, Next } from "hono";
import * as Sentry from "@sentry/node";

/**
 * Sentry request-context middleware.
 *
 * Tags every in-flight request with its `requestId` and route so errors
 * surfaced via Hono's `app.onError` already have the context needed to
 * debug them. Runs inside a `withScope` so tags do not leak between
 * requests.
 *
 * This middleware does nothing when Sentry is not initialized (no DSN),
 * so it is safe to keep wired in dev/preview.
 */
export async function sentryMiddleware(c: Context, next: Next) {
  return Sentry.withScope(async (scope) => {
    const requestId =
      c.req.header("X-Request-Id") ||
      c.res.headers.get("X-Request-Id") ||
      undefined;

    if (requestId) {
      scope.setTag("requestId", requestId);
    }
    scope.setTag("route", c.req.path);
    scope.setTag("method", c.req.method);

    try {
      await next();
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          requestId: requestId ?? "unknown",
          route: c.req.path,
          method: c.req.method,
        },
      });
      throw err;
    }
  });
}
