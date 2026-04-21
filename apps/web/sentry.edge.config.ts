/**
 * Sentry edge config — runs in the Next.js Edge runtime (middleware,
 * edge routes, edge-rendered pages).
 *
 * Only initializes when `NEXT_PUBLIC_SENTRY_DSN` is set. In dev/preview
 * environments without a DSN this is a complete no-op.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend(event) {
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
