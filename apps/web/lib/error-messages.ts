/**
 * Centralized user-friendly error message copy.
 *
 * Use {@link errorMessageForCode} to resolve a machine code to a friendly
 * string. Unknown or missing codes fall back to `ERROR_MESSAGES.unknown`.
 *
 * Phase 6e — dev-plan.md §6e.
 */
export const ERROR_MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  stripe_declined: "Payment declined. Try a different card or contact support.",
  session_expired: "Your session expired. Sign in again to continue.",
  content_not_found: "This lesson or theme doesn't exist.",
  forbidden: "You don't have access to this content. Check your purchases.",
  validation: "Something in the form needs fixing. Review highlighted fields.",
  rate_limited: "Too many requests. Wait a moment and try again.",
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

  // Common aliases — keep this list narrow and intentional.
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
  return mapped ? ERROR_MESSAGES[mapped] : ERROR_MESSAGES.unknown;
}
