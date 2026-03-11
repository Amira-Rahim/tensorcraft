import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { corsMiddleware } from "./middleware/cors";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { health } from "./routes/health";
import { waitlist } from "./routes/waitlist";
import { progress } from "./routes/progress";
import { payments } from "./routes/payments";

const app = new Hono();

// Global middleware
app.use("*", corsMiddleware);
app.use("*", rateLimitMiddleware);

// Routes
app.route("/api/health", health);
app.route("/api/waitlist", waitlist);
app.route("/api/progress", progress);
app.route("/api/payments", payments);

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

serve({
  fetch: app.fetch,
  port,
});

export default app;
