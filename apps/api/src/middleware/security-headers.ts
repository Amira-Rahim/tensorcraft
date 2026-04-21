import type { Context, Next } from "hono";

/**
 * Security headers middleware.
 * Sets CSP, HSTS, X-Content-Type-Options, X-Frame-Options, etc.
 *
 * Note: `X-Request-Id` is now set by the separate requestIdMiddleware
 * (see middleware/request-id.ts). Mount requestIdMiddleware before this
 * middleware if you need a request ID on every response.
 */
export async function securityHeadersMiddleware(c: Context, next: Next) {
  c.header("Content-Security-Policy", "default-src 'none'");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  await next();
}
