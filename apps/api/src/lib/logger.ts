/**
 * Structured logger, Pino.
 *
 * Configuration:
 *  - Pretty-printed in development (NODE_ENV !== "production") for readable logs.
 *  - JSON output in production so aggregators (Fly logs, Axiom, etc.) parse cleanly.
 *  - Default bindings: `app: "tensorcraft-api"`, `version: <pkg.version>`.
 *
 * Usage:
 *   import { logger } from "../lib/logger";
 *   logger.info({ userId, route: "profiles" }, "Profile updated");
 *   logger.error({ err, requestId, route: "payments" }, "Webhook failed");
 *
 * Per-request child loggers (with requestId baked in) are exposed on the Hono
 * context by the requestIdMiddleware: `c.get("logger").info(...)`.
 */

import pino from "pino";

// Package version, keep in sync with apps/api/package.json
// Hardcoded to avoid runtime JSON import complications in ESM builds.
const APP_VERSION = "0.0.0";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

export const logger = pino({
  level,
  base: {
    app: "tensorcraft-api",
    version: APP_VERSION,
  },
  // Pretty-print in dev; raw JSON in prod.
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
  // Redact common sensitive keys if they're ever passed in a log object.
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "api_key",
      "apiKey",
      "secret",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authorization",
      "*.api_key",
      "*.apiKey",
      "*.secret",
    ],
    remove: true,
  },
});

export type Logger = typeof logger;
