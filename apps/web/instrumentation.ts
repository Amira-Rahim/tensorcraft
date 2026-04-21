/**
 * Next.js instrumentation hook — loads the appropriate Sentry config
 * per runtime so server / edge / client code each get their own init.
 *
 * Required by `@sentry/nextjs` starting in Next.js 13.4+.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
