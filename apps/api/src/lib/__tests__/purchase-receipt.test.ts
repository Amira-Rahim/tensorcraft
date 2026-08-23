import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Purchase receipt.
 *
 * A buyer currently receives NOTHING after paying: the only purchase-time
 * email action is a Kit tag, and the Kit credentials 401 (see the Tier 1-OPS
 * entry). A receipt is a legal expectation and a leading cause of
 * chargebacks, so it is sent over Resend, which is already wired and working
 * in this repo, rather than waiting on Kit to be repaired.
 */

const sendSpy = vi.fn().mockResolvedValue({ data: { id: "email_1" } });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendSpy };
  },
}));

vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const captureException = vi.fn();
vi.mock("../error-tracking", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

import { sendPurchaseReceipt } from "../email";

const PARAMS = {
  email: "buyer@example.com",
  worldIds: ["deep-orbit"],
  amount: 49,
  sessionId: "cs_test_123",
  purchasedAt: new Date("2026-08-23T10:00:00Z"),
};

beforeEach(() => {
  sendSpy.mockClear();
  sendSpy.mockResolvedValue({ data: { id: "email_1" } });
  captureException.mockClear();
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("APP_URL", "https://tensorcraft.app");
});

describe("sendPurchaseReceipt", () => {
  it("emails the buyer what they bought and what they paid", async () => {
    await sendPurchaseReceipt(PARAMS);

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const arg = sendSpy.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(arg.to).toBe("buyer@example.com");
    // The amount must appear as money, not as a bare integer: "49" alone
    // reads as an order number in a receipt.
    expect(arg.text).toContain("$49.00");
    expect(arg.html).toContain("$49.00");
    // Slugs are not customer-facing.
    expect(arg.text).toContain("Deep Orbit");
    expect(arg.text).not.toContain("deep-orbit");
  });

  it("carries an order reference so support can find the payment", async () => {
    await sendPurchaseReceipt(PARAMS);

    const arg = sendSpy.mock.calls[0][0] as { text: string };
    expect(arg.text).toContain("cs_test_123");
  });

  /**
   * The F1 lesson, encoded: the Resend SDK resolves `{data, error}` and never
   * throws, so a handler that only try/catches reports success on a
   * fully-rate-limited send.
   */
  it("captures a Resend error result rather than reporting success", async () => {
    sendSpy.mockResolvedValue({
      data: null,
      error: { name: "rate_limit_exceeded", message: "Too many requests" },
    });

    await expect(sendPurchaseReceipt(PARAMS)).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("never throws when the SDK itself throws", async () => {
    sendSpy.mockRejectedValue(new Error("socket hang up"));

    await expect(sendPurchaseReceipt(PARAMS)).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  /**
   * This send happens inside the Stripe webhook handler. A hung Resend
   * connection must not hold the handler past Stripe's timeout and force a
   * re-delivery, which is the defect already recorded against the two
   * awaited Kit calls.
   */
  it("gives up on a hung send instead of stalling the webhook", async () => {
    sendSpy.mockReturnValue(new Promise(() => {}));

    await expect(
      sendPurchaseReceipt({ ...PARAMS, timeoutMs: 10 }),
    ).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("skips silently when Resend is not configured", async () => {
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendPurchaseReceipt: fresh } = await import("../email");

    await expect(fresh(PARAMS)).resolves.toBeUndefined();
    expect(sendSpy).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });
});
