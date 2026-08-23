import { describe, it, expect, vi, beforeEach } from "vitest";

const sentry = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/node", () => ({
  captureException: (...a: unknown[]) => sentry.captureException(...a),
}));

// Mock the logger BEFORE importing the module under test so error-tracking
// picks up the spied instance via module-mock resolution.
vi.mock("../logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { captureException, captureMessage } from "../error-tracking";
import { logger } from "../logger";

describe("error-tracking", () => {
  beforeEach(() => {
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.warn).mockReset();
    vi.mocked(logger.error).mockReset();
  });

  describe("captureException", () => {
    it("logs error with correct format", () => {
      const error = new Error("Something broke");
      captureException(error, {
        source: "payments.webhook",
        userId: "user_123",
        extra: { orderId: "order_456" },
      });

      expect(logger.error).toHaveBeenCalledOnce();

      const [context, message] = vi.mocked(logger.error).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(message).toBe("Something broke");
      expect(context.level).toBe("error");
      expect(context.source).toBe("payments.webhook");
      expect(context.userId).toBe("user_123");
      expect((context.extra as { orderId: string }).orderId).toBe("order_456");
      expect(context.timestamp).toBeDefined();
      expect(context.stack).toBeDefined();
    });

    it("handles non-Error objects", () => {
      captureException("string error", { source: "test" });

      const [, message] = vi.mocked(logger.error).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(message).toBe("string error");
    });
  });

  describe("captureMessage", () => {
    it("logs info message via logger.info", () => {
      captureMessage("User signed up", { source: "auth.signup" }, "info");

      expect(logger.info).toHaveBeenCalledOnce();

      const [context, message] = vi.mocked(logger.info).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(message).toBe("User signed up");
      expect(context.level).toBe("info");
      expect(context.source).toBe("auth.signup");
      expect(context.timestamp).toBeDefined();
    });

    it("uses correct logger method per level", () => {
      captureMessage("info msg", { source: "test" }, "info");
      captureMessage("warning msg", { source: "test" }, "warning");
      captureMessage("error msg", { source: "test" }, "error");

      expect(logger.info).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.error).toHaveBeenCalledOnce();

      const [infoCtx] = vi.mocked(logger.info).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(infoCtx.level).toBe("info");

      const [warnCtx] = vi.mocked(logger.warn).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(warnCtx.level).toBe("warning");

      const [errCtx] = vi.mocked(logger.error).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(errCtx.level).toBe("error");
    });

    it("defaults to info level when not specified", () => {
      captureMessage("default level", { source: "test" });

      const [context] = vi.mocked(logger.info).mock.calls[0] as [
        Record<string, unknown>,
        string,
      ];
      expect(context.level).toBe("info");
    });
  });

  /**
   * Sentry forwarding, added 2026-08-23.
   *
   * This module was a logger-only shim carrying a comment that said "when
   * ready to integrate Sentry, replace the logger calls". Sentry WAS
   * integrated in the meantime, but only for UNHANDLED errors: the global
   * error handler, the Hono middleware, and the process-level handlers.
   *
   * So all 22 deliberate capture sites, which are the ones on the money path
   * and therefore the ones worth alerting on, reached Fly logs alone. Fly logs
   * are ephemeral and unsearchable after the fact. Sentry alert rules built on
   * top of that would never have fired.
   */
  describe("Sentry forwarding", () => {
    beforeEach(() => {
      sentry.captureException.mockClear();
    });

    it("forwards to Sentry, not just to the logger", () => {
      const err = new Error("payment settle failed");

      captureException(err, { source: "payments.webhook" });

      expect(sentry.captureException).toHaveBeenCalledTimes(1);
      expect(sentry.captureException.mock.calls[0][0]).toBe(err);
    });

    /**
     * `source` becomes a TAG rather than sitting in extra, because tags are
     * what Sentry alert rules and search filter on. A rule matching
     * `source:payments.*` is the entire point.
     */
    it("tags the event with its source so alert rules can filter on it", () => {
      captureException(new Error("x"), { source: "payments.receipt" });

      const scope = sentry.captureException.mock.calls[0][1] as {
        tags?: Record<string, string>;
      };
      expect(scope.tags?.source).toBe("payments.receipt");
    });

    it("attaches the user when one is known", () => {
      captureException(new Error("x"), {
        source: "github.token",
        userId: "user_123",
      });

      const scope = sentry.captureException.mock.calls[0][1] as {
        user?: { id: string };
      };
      expect(scope.user?.id).toBe("user_123");
    });

    it("passes extra context through", () => {
      captureException(new Error("x"), {
        source: "payments.geo-backstop",
        extra: { sessionId: "cs_live_1", billingCountry: "DE" },
      });

      const scope = sentry.captureException.mock.calls[0][1] as {
        extra?: Record<string, unknown>;
      };
      expect(scope.extra?.billingCountry).toBe("DE");
    });

    it("wraps a non-Error so Sentry receives a stack, not a bare string", () => {
      captureException("just a string", { source: "somewhere" });

      expect(sentry.captureException.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });
});
