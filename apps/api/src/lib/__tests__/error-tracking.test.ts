import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureException, captureMessage } from "../error-tracking";

describe("error-tracking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("captureException", () => {
    it("logs error with correct format", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const error = new Error("Something broke");
      captureException(error, {
        source: "payments.webhook",
        userId: "user_123",
        extra: { orderId: "order_456" },
      });

      expect(consoleSpy).toHaveBeenCalledOnce();

      const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(logged.level).toBe("error");
      expect(logged.message).toBe("Something broke");
      expect(logged.source).toBe("payments.webhook");
      expect(logged.userId).toBe("user_123");
      expect(logged.extra.orderId).toBe("order_456");
      expect(logged.timestamp).toBeDefined();
      expect(logged.stack).toBeDefined();
    });

    it("handles non-Error objects", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      captureException("string error", { source: "test" });

      const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(logged.message).toBe("string error");
    });
  });

  describe("captureMessage", () => {
    it("logs info message with console.log", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      captureMessage("User signed up", { source: "auth.signup" }, "info");

      expect(logSpy).toHaveBeenCalledOnce();

      const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(logged.level).toBe("info");
      expect(logged.message).toBe("User signed up");
      expect(logged.source).toBe("auth.signup");
      expect(logged.timestamp).toBeDefined();
    });

    it("uses correct console method per level", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      captureMessage("info msg", { source: "test" }, "info");
      captureMessage("warning msg", { source: "test" }, "warning");
      captureMessage("error msg", { source: "test" }, "error");

      expect(logSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(errorSpy).toHaveBeenCalledOnce();

      const infoLog = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(infoLog.level).toBe("info");

      const warningLog = JSON.parse(warnSpy.mock.calls[0][0] as string);
      expect(warningLog.level).toBe("warning");

      const errorLog = JSON.parse(errorSpy.mock.calls[0][0] as string);
      expect(errorLog.level).toBe("error");
    });

    it("defaults to info level when not specified", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      captureMessage("default level", { source: "test" });

      const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(logged.level).toBe("info");
    });
  });
});
