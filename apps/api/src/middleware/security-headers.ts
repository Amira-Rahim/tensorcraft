import type { Context, Next } from "hono";

/**
 * Security headers middleware.
 * Sets CSP, HSTS, X-Content-Type-Options, X-Frame-Options,
 * and generates a unique X-Request-ID per request.
 */
export async function securityHeadersMiddleware(c: Context, next: Next) {
  const requestId = crypto.randomUUID();

  c.header("X-Request-ID", requestId);
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
