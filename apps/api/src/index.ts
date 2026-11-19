// Sentry must be initialized BEFORE any other imports that might touch
// Node internals we want auto-instrumented (http, fetch, etc.).
import { initSentry } from "./lib/sentry";
import * as Sentry from "@sentry/node";
initSentry();

import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { PROJECT_BODY_LIMIT } from "@tensorcraft/shared";
import { serve } from "@hono/node-server";
import { corsMiddleware } from "./middleware/cors";
import { globalRateLimitMiddleware } from "./middleware/rate-limit";
import { securityHeadersMiddleware } from "./middleware/security-headers";
import { versionMiddleware } from "./middleware/version";
import { requestIdMiddleware } from "./middleware/request-id";
import { sentryMiddleware } from "./middleware/sentry";
import { logger } from "./lib/logger";
import { shutdownPostHog } from "./lib/posthog";
import { assertEnv } from "./env";
import { health } from "./routes/health";
import { waitlist } from "./routes/waitlist";
import { progress } from "./routes/progress";
import { payments } from "./routes/payments";
import { purchases } from "./routes/purchases";
import { profiles } from "./routes/profiles";
import { exerciseAttempts } from "./routes/exercise-attempts";
import { review } from "./routes/review";
import { admin } from "./routes/admin";
import { github } from "./routes/github";
import { skillEvents } from "./routes/skill-events";
import { issues } from "./routes/issues";
import { emailTags } from "./routes/email-tags";
import { certificates } from "./routes/certificates";
import { onboarding } from "./routes/onboarding";
import { preferences } from "./routes/preferences";
import { analyticsConsent } from "./routes/analytics-consent";
import { webhooks } from "./routes/webhooks";

const app = new Hono();

// Global middleware
// Request-ID runs first so every response carries X-Request-Id and every
// downstream handler can log with the correlation id baked in.
app.use("*", requestIdMiddleware);
// Sentry runs right after request-id so every captured event inherits the
// correlation tags set by sentryMiddleware.
app.use("*", sentryMiddleware);
app.use("*", versionMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", corsMiddleware);
// Issues enforce their own limit; project uploads include base64 model weights.
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/issues")) {
    return next();
  }
  return bodyLimit({
    maxSize:
      c.req.path === "/api/github/project-export"
        ? PROJECT_BODY_LIMIT
        : 1024 * 1024,
  })(c, next);
});

// Rate limit all routes except webhooks and the liveness probe; the exempt
// list and its rationale live next to the limiter in middleware/rate-limit.ts.
app.use("*", globalRateLimitMiddleware);

// Global error handler, sanitize errors, never leak internals
app.onError((err, c) => {
  const requestId = c.res.headers.get("X-Request-Id");
  logger.error(
    {
      err,
      requestId,
      route: c.req.path,
      method: c.req.method,
    },
    "Unhandled error",
  );
  // Capture to Sentry (no-op if SENTRY_DSN not set).
  Sentry.captureException(err, {
    tags: {
      requestId: requestId ?? "unknown",
      route: c.req.path,
      method: c.req.method,
    },
  });
  return c.json(
    {
      error: "Internal server error",
      requestId,
    },
    500,
  );
});

// Routes
app.route("/api/health", health);
app.route("/api/waitlist", waitlist);
app.route("/api/progress", progress);
app.route("/api/payments", payments);
app.route("/api/purchases", purchases);
app.route("/api/profiles", profiles);
app.route("/api/exercise-attempts", exerciseAttempts);
app.route("/api/review", review);
app.route("/api/admin", admin);
app.route("/api/github", github);
app.route("/api/skill-events", skillEvents);
app.route("/api/issues", issues);
app.route("/api/email", emailTags);
app.route("/api/certificates", certificates);
app.route("/api/onboarding", onboarding);
app.route("/api/preferences", preferences);
app.route("/api/analytics-consent", analyticsConsent);
app.route("/api/webhooks", webhooks);

// Root
app.get("/", (c) => {
  return c.json({
    name: "Tensorcraft API",
    version: "0.0.0",
    docs: "/api/health",
  });
});

const port = Number(process.env.PORT) || 3001;

logger.info({ port }, `Tensorcraft API running on http://localhost:${port}`);

// Fail loud at boot, never silently at request time (env.ts). Placed
// directly before serve(): every import above is side-effect-safe without
// env, and a misconfigured deploy should die HERE with a named list, not
// serve requests with features silently off.
assertEnv();

const server = serve({
  fetch: app.fetch,
  port,
  hostname: process.env.TENSORCRAFT_REVIEW === "1" ? "127.0.0.1" : undefined,
});

// Graceful shutdown
let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, `${signal} received, shutting down gracefully`);
  server.close(() => {
    void shutdownPostHog()
      .catch(() => {
        logger.warn("PostHog server event flush failed during shutdown");
      })
      .finally(() => {
        clearTimeout(shutdownTimeout);
        logger.info("Server closed");
        process.exit(0);
      });
  });

  // Force exit after 10s if connections are still hanging
  const shutdownTimeout = setTimeout(() => {
    logger.error("Forcing exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
