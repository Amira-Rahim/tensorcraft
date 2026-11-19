/**
 * Centralized user-friendly error message copy.
 *
 * Use {@link errorMessageForCode} to resolve a machine code to a friendly
 * string. Unknown or missing codes fall back to `ERROR_MESSAGES.unknown`.

 */
export const ERROR_MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  stripe_declined: "Payment declined. Try a different card or contact support.",
  session_expired: "Your session expired. Sign in again to continue.",
  content_not_found: "This page doesn't exist.",
  forbidden: "You don't have access to this content. Check your purchases.",
  validation: "Something in the form needs fixing. Review highlighted fields.",
  rate_limited: "Too many requests. Wait a moment and try again.",
  // A transient database fault is not a broken product, and the advice
  // differs: retry, do not write to support about a lesson that was never
  // broken. Before this existed, a 2s Supabase blip fell through to `unknown`
  // and read as "the content is broken" to a paying customer.
  service_unavailable:
    "We can't reach our servers right now. Nothing you've finished is lost. Try again in a moment.",
  unknown: "Something went wrong on our end. Try again or contact support.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * Resolve an error code to a user-friendly message.
 *
 * Accepts known codes from {@link ERROR_MESSAGES} as well as common aliases
 * emitted by upstream systems (Stripe, Supabase, HTTP status conventions).
 * Falls back to `ERROR_MESSAGES.unknown` for anything unrecognized, including
 * `undefined`.
 */
export function errorMessageForCode(code: string | undefined): string {
  if (!code) return ERROR_MESSAGES.unknown;

  // Direct hit on a known key.
  if (code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as ErrorCode];
  }

  // Common aliases, keep this list narrow and intentional.
  const alias: Record<string, ErrorCode> = {
    // Stripe decline codes
    card_declined: "stripe_declined",
    payment_failed: "stripe_declined",
    payment_declined: "stripe_declined",
    // Auth / session
    unauthorized: "session_expired",
    token_expired: "session_expired",
    // Content
    not_found: "content_not_found",
    // Access
    access_denied: "forbidden",
    // Network / fetch
    fetch_failed: "network",
    network_error: "network",
    // Rate limiting
    too_many_requests: "rate_limited",
  };

  const mapped = alias[code];
  if (mapped) return ERROR_MESSAGES[mapped];

  // Postgres SQLSTATEs, which arrive from Supabase with no friendlier code.
  // Class 08 is "connection exception"; the rest are overload, shutdown and
  // statement-cancellation. All are transient, so the advice is to retry.
  // Matched on exact five-character SQLSTATEs so an unrelated string that
  // merely starts with "08" cannot be mistaken for one.
  const isSqlState = /^[0-9A-Z]{5}$/.test(code);
  if (isSqlState) {
    const TRANSIENT_SQLSTATES = new Set([
      "53300", // too_many_connections
      "57P01", // admin_shutdown
      "57P03", // cannot_connect_now
      "57014", // query_canceled
    ]);
    if (code.startsWith("08") || TRANSIENT_SQLSTATES.has(code)) {
      return ERROR_MESSAGES.service_unavailable;
    }
  }

  return ERROR_MESSAGES.unknown;
}
