import { cors } from "hono/cors";

const DEFAULT_ORIGINS =
  "http://localhost:3000,https://tensorcraft.app,https://www.tensorcraft.app";

/**
 * CORS middleware for the Tensorcraft API.
 * Origins are read from CORS_ORIGINS env var (comma-separated).
 * Falls back to default origins if not set.
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
