/**
 * Sentry client-side config — runs in the browser.
 *
 * Only initializes when `NEXT_PUBLIC_SENTRY_DSN` is set. In dev/preview
 * environments without a DSN this is a complete no-op.
 *
 * PII scrubbing: `beforeSend` strips `email`, `user_id`, `ip_address`,
 * and any `user` payload from events so nothing personal leaves the
 * browser.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      // Hydration mismatches are noisy in dev; real ones surface via the
      // Next.js error overlay and server logs.
      "Hydration failed",
      "Text content does not match server-rendered HTML",
      "There was an error while hydrating",
      // Common browser-extension noise.
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      /extension:\/\//i,
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
    ],
    beforeSend(event) {
      // Strip PII — we do not want emails, user IDs, or IPs in Sentry.
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
      return event;
    },
  });
}
