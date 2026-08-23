/**
 * Error tracking: structured log AND Sentry.
 *
 * History worth keeping, because it produced a silent gap. This module was a
 * logger-only shim carrying the note "when ready to integrate Sentry, replace
 * the logger calls". Sentry was integrated later, but only for UNHANDLED
 * errors: the global handler in `index.ts`, the Hono middleware, and the
 * process-level handlers in `lib/sentry.ts`.
 *
 * So every DELIBERATE capture, all 22 of them, went to Fly logs alone. Those
 * are the money-path errors: a receipt that did not send, a Kit suppression
 * write that failed, a purchase settling from a geo-gated region. Fly logs are
 * ephemeral and unsearchable, so those were effectively invisible, and any
 * Sentry alert rule built on them would never have fired. Fixed 2026-08-23.
 *
 * The logger call stays: it is the only record when no DSN is configured,
 * which is the case in CI and local development. Sentry is a no-op there.
 */

import * as Sentry from "@sentry/node";
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

  // `source` is a TAG, not extra: tags are what Sentry alert rules and search
  // can filter on, which is what makes a rule like `source:payments.*`
  // possible. See docs/observability.md for the rules worth creating.
  Sentry.captureException(err, {
    tags: { source: context.source },
    ...(context.userId ? { user: { id: context.userId } } : {}),
    ...(context.extra ? { extra: context.extra } : {}),
  });
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
