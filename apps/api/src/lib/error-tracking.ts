/**
 * Error tracking utility — structured error logging.
 *
 * Drop-in compatible with Sentry's captureException API shape.
 * When ready to integrate Sentry, replace the logger calls with
 * Sentry.captureException / Sentry.captureMessage.
 */

import { logger } from "./logger";

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

  logger.error(
    {
      level: "error",
      timestamp,
      stack: err.stack,
      err,
      ...context,
    },
    err.message,
  );
}

export function captureMessage(
  message: string,
  context: ErrorContext,
  level: "info" | "warning" | "error" = "info",
): void {
  const timestamp = new Date().toISOString();

  const payload = {
    level,
    timestamp,
    ...context,
  };

  if (level === "error") {
    logger.error(payload, message);
  } else if (level === "warning") {
    logger.warn(payload, message);
  } else {
    logger.info(payload, message);
  }
}
