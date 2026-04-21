import type { Context, Next } from "hono";

/**
 * API versioning header middleware.
 *
 * Adds an `X-API-Version` header to every response so clients can detect the
 * deployed API contract. We publish the major "v1" marker rather than the
 * package semver — clients care about API-contract compatibility, not release
 * minutiae.
 *
 * Phase 6 §6h.
 */
export const API_VERSION = "v1";

export async function versionMiddleware(c: Context, next: Next) {
  c.header("X-API-Version", API_VERSION);
  await next();
}
