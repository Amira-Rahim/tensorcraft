import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { corsMiddleware } from "./middleware/cors";
import { health } from "./routes/health";

const app = new Hono();

// Global middleware
app.use("*", corsMiddleware);

// Routes
app.route("/api/health", health);

// Future route groups:
// app.route("/api/auth", auth);
// app.route("/api/progress", progress);
// app.route("/api/payments", payments);
// app.route("/api/waitlist", waitlist);

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
