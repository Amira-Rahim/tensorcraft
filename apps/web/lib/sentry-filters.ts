/**
 * Sentry event filters, kept in their own module so they can be unit tested.
 *
 * `sentry.server.config.ts` calls `Sentry.init()` at import time, so anything
 * defined inside it is untestable without booting the SDK. Predicates live
 * here instead and are imported by the config.
 */

/** The minimum shape we read. Structural on purpose: no SDK import needed. */
export type FilterableEvent = {
  message?: string;
  exception?: { values?: Array<{ type?: string; value?: string }> };
};

/**
 * Next.js E787, "Failed to find Server Action".
 *
 * Next raises this for ANY multipart POST that arrives without a
 * `Next-Action` header, which is what vulnerability scanners send at `/` all
 * day. Diagnosed 2026-09-13 as scanner traffic rather than deployment skew:
 * skew protection is on, and the same probes land against current builds.
 *
 * Matched on the message prefix rather than loosely, because a REAL skew
 * failure produces this same error. Widening the match would trade scanner
 * noise for the loss of a genuine signal that a deploy broke in-flight Server
 * Actions for real users, which is the more expensive mistake.
 */
export function isServerActionProbe(event: FilterableEvent): boolean {
  const PREFIX = "Failed to find Server Action";
  if (event.message?.startsWith(PREFIX)) return true;
  return (event.exception?.values ?? []).some((v) =>
    v.value?.startsWith(PREFIX),
  );
}
