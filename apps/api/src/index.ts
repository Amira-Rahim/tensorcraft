import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { serve } from "@hono/node-server";
import { corsMiddleware } from "./middleware/cors";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { securityHeadersMiddleware } from "./middleware/security-headers";
import { health } from "./routes/health";
import { waitlist } from "./routes/waitlist";
import { progress } from "./routes/progress";
import { payments } from "./routes/payments";
import { profiles } from "./routes/profiles";
import { exerciseAttempts } from "./routes/exercise-attempts";
import { admin } from "./routes/admin";
import { github } from "./routes/github";
import { skillEvents } from "./routes/skill-events";
// V1: Newsletter endpoint — Kit integration + waitlist dual-write.
// Unmounted until email sequences are ready. See routes/newsletter.ts.
// import { newsletter } from "./routes/newsletter";

const app = new Hono();

// Global middleware
app.use("*", securityHeadersMiddleware);
app.use("*", corsMiddleware);
app.use("*", bodyLimit({ maxSize: 1024 * 1024 })); // 1 MB global limit

// Rate limit all routes EXCEPT the Stripe webhook (Stripe retries on failure)
app.use("*", async (c, next) => {
  if (c.req.path === "/api/payments/webhook") {
    return next();
  }
  return rateLimitMiddleware(c, next);
});

// Global error handler — sanitize errors, never leak internals
app.onError((err, c) => {
  console.error("Unhandled error:", {
    message: err.message,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  });
  return c.json(
    {
      error: "Internal server error",
      requestId: c.res.headers.get("X-Request-ID"),
    },
    500,
  );
});

// Routes
app.route("/api/health", health);
app.route("/api/waitlist", waitlist);
app.route("/api/progress", progress);
app.route("/api/payments", payments);
app.route("/api/profiles", profiles);
app.route("/api/exercise-attempts", exerciseAttempts);
app.route("/api/admin", admin);
app.route("/api/github", github);
app.route("/api/skill-events", skillEvents);
// V1: app.route("/api/newsletter", newsletter); // Unmounted — see line 16

// Root
app.get("/", (c) => {
  return c.json({
    name: "Tensorcraft API",
    version: "0.0.0",
    docs: "/api/health",
  });
});

const port = Number(process.env.PORT) || 3001;

console.log(`Tensorcraft API running on http://localhost:${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit after 10s if connections are still hanging
  setTimeout(() => {
    console.error("Forcing exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
