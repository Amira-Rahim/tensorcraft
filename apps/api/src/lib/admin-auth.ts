import { timingSafeEqual } from "node:crypto";

/**
 * Timing-safe check of a caller-supplied admin key against `ADMIN_API_KEY`.
 *
 * Extracted from `routes/admin.ts` on 2026-08-23 so the internal Kit
 * unsubscribe relay could reuse it. Duplicating an auth primitive is how the
 * two copies drift, and only one of them gets the fix.
 *
 * Fails CLOSED when `ADMIN_API_KEY` is unset: an unconfigured server must
 * reject every caller, never accept every caller.
 */
export function isValidAdminKey(provided: string | undefined): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) {
    // Still compare, so a wrong-length key does not return measurably faster
    // than a right-length one and leak the length.
    const dummy = Buffer.alloc(expectedBuf.length);
    timingSafeEqual(expectedBuf, dummy);
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}
