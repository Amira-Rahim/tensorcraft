/**
 * Sentry init for the API. Must be imported before any route handlers so
 * Sentry's auto-instrumentation can monkey-patch Node internals.
 *
 * Only initializes when `SENTRY_DSN` is set; dev/preview without a DSN
 * gets a no-op. PII scrubbing runs on every event.
 */

import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Strip PII, never let emails, user IDs, or IPs leave the server.
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
        delete event.user.id;
      }
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }
      if (event.extra) {
        delete event.extra.email;
        delete event.extra.user_id;
      }
      return event;
    },
  });

  // Process-level safety nets.
  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
  });
  process.on("uncaughtException", (err) => {
    Sentry.captureException(err);
  });

  initialized = true;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

/** Test-only: reset module state between tests. */
export function __resetForTests(): void {
  initialized = false;
}

export { Sentry };
