/**
 * Sentry server-side config, runs in the Node.js runtime for server
 * components, route handlers, and API routes.
 *
 * Reads `SENTRY_DSN` first (server-only secret), falling back to
 * `NEXT_PUBLIC_SENTRY_DSN` for environments that only set the public var.
 * In dev/preview environments without a DSN this is a complete no-op.
 */

import * as Sentry from "@sentry/nextjs";
import { isServerActionProbe } from "./lib/sentry-filters";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Server traces are lower-volume than client + harder to reproduce
    // post-hoc, so we sample 30% at launch (vs 10% on the client) to keep
    // launch-day incidents debuggable. Revert to 0.1 once daily traffic
    // is well above 10k MAU and the spans become noise.
    tracesSampleRate: 0.3,
    maxBreadcrumbs: 50,
    maxValueLength: 500,
    beforeSend(event) {
      // Scanner noise, not a real failure. Next raises E787 for any
      // multipart POST without a `Next-Action` header, which is what
      // vulnerability scanners send at `/` constantly. Dropped rather than
      // rate limited because these requests never came from our own client.
      if (isServerActionProbe(event)) return null;

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
