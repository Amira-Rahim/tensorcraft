import { cors } from "hono/cors";

const prodOrigins = ["https://tensorcraft.app", "https://www.tensorcraft.app"];
const devOrigins =
  process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"];

/**
 * CORS middleware for the Tensorcraft API.
 * Origins are read from CORS_ORIGINS env var (comma-separated) and merged with
 * the built-in production origins. In non-production NODE_ENV, localhost:3000
 * is always allowed so the dev web server can reach the API regardless of how
 * CORS_ORIGINS is configured.
 */
const configured = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const origins = Array.from(
  new Set([...prodOrigins, ...devOrigins, ...configured]),
);

export const corsMiddleware = cors({
  origin: origins,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
});
