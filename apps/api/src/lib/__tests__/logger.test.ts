import { describe, it, expect } from "vitest";
import { logger } from "../logger";

describe("logger (Pino smoke test)", () => {
  it("exposes standard log level methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("spawns child loggers with extra bindings", () => {
    const child = logger.child({ requestId: "abc-123", route: "test" });
    expect(typeof child.info).toBe("function");
    // Child loggers inherit the parent's bindings — a simple identity check.
    expect(child.bindings()).toMatchObject({
      app: "tensorcraft-api",
      requestId: "abc-123",
      route: "test",
    });
  });

  it("has the expected default bindings", () => {
    const bindings = logger.bindings();
    expect(bindings.app).toBe("tensorcraft-api");
    expect(bindings.version).toBeDefined();
  });

  it("does not throw when logging an Error object", () => {
    const err = new Error("boom");
    expect(() => logger.error({ err }, "handled error")).not.toThrow();
  });
});
