import { describe, it, expect, vi, beforeEach } from "vitest";

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
});
