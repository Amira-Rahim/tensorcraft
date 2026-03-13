/**
 * Error tracking utility — structured error logging.
 *
 * Drop-in compatible with Sentry's captureException API shape.
 * When ready to integrate Sentry, replace the console calls with
 * Sentry.captureException / Sentry.captureMessage.
 */

interface ErrorContext {
  /** Where the error occurred (e.g. "payments.webhook", "progress.update") */
  source: string;
  /** User ID if available */
  userId?: string;
  /** Any extra data to attach */
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context: ErrorContext): void {
  const timestamp = new Date().toISOString();
  const err = error instanceof Error ? error : new Error(String(error));

  console.error(
    JSON.stringify({
      level: "error",
      timestamp,
      message: err.message,
      stack: err.stack,
      ...context,
    }),
  );
}

export function captureMessage(
  message: string,
  context: ErrorContext,
  level: "info" | "warning" | "error" = "info",
): void {
  const timestamp = new Date().toISOString();

  console.error(
    JSON.stringify({
      level,
      timestamp,
      message,
      ...context,
    }),
  );
}
