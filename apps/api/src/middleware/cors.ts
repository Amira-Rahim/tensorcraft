import { cors } from "hono/cors";

const prodOrigins = ["https://tensorcraft.app", "https://www.tensorcraft.app"];
const devOrigins =
  process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"];
const DEFAULT_ORIGINS = [...prodOrigins, ...devOrigins].join(",");

/**
 * CORS middleware for the Tensorcraft API.
 * Origins are read from CORS_ORIGINS env var (comma-separated).
 * Falls back to default origins if not set.
 * In development, localhost:3000 is included automatically.
 */
const origins = (process.env.CORS_ORIGINS ?? DEFAULT_ORIGINS)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: origins,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
});
