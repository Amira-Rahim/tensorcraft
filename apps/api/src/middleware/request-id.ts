import type { Context, Next } from "hono";
import { logger } from "../lib/logger";

/**
 * Request-ID middleware.
 *
 * Generates a UUID per request, attaches it as:
 *  - `X-Request-Id` response header (for client-side correlation)
 *  - `requestId` value on the Hono context (for downstream handlers)
 *  - `logger` on the context: a Pino child logger with `requestId` baked in
 *
 * Honors an incoming `X-Request-Id` header when provided (e.g. from an upstream
 * load balancer) so traces span hops cleanly. Otherwise mints a fresh UUID.
 *
 * Phase 6 §6h. Supersedes the inline request-id generation that used to live
 * inside securityHeadersMiddleware — security-headers now delegates here.
 */
export async function requestIdMiddleware(c: Context, next: Next) {
  const incoming = c.req.header("x-request-id");
  const requestId =
    incoming && /^[0-9a-f-]{8,64}$/i.test(incoming)
      ? incoming
      : crypto.randomUUID();

  c.header("X-Request-Id", requestId);
  c.set("requestId", requestId);
  c.set(
    "logger",
    logger.child({
      requestId,
      method: c.req.method,
      path: c.req.path,
    }),
  );

  await next();
}
