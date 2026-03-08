import { cors } from "hono/cors";

/**
 * CORS middleware for the Tensorcraft API.
 * Allows the Next.js frontend to make requests.
 */
export const corsMiddleware = cors({
  origin: [
    "http://localhost:3000",
    "https://tensorcraft.dev",
    "https://www.tensorcraft.dev",
  ],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
});
