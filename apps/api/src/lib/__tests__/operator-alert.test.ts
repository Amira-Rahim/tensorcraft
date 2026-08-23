import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Operator alerts.
 *
 * Sentry captures 22 error sites across the API and notifies nobody, because
 * alert rules only exist in a dashboard that has none. PostHog has no project.
 * So today the only way the operator learns that something happened is a user
 * emailing support, which is the thing they explicitly want to stop relying on.
 *
 * This is the cheap half: push the handful of events worth waking up for into
 * an inbox, over Resend, which already works. It is not a replacement for
 * Sentry alert rules; it covers the money path, which is where silence costs
 * the most.
 */

const sendSpy = vi.fn().mockResolvedValue({ data: { id: "email_1" } });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendSpy };
  },
}));

const captureException = vi.fn();
vi.mock("../error-tracking", () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));
vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { sendOperatorAlert } from "../operator-alert";

beforeEach(() => {
  sendSpy.mockClear();
  sendSpy.mockResolvedValue({ data: { id: "email_1" } });
  captureException.mockClear();
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("OPERATOR_ALERT_EMAIL", "ops@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendOperatorAlert", () => {
  it("emails the operator with the severity and event in the subject", async () => {
    await sendOperatorAlert({
      event: "purchase",
      severity: "info",
      summary: "Deep Orbit sold for $59.00",
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const arg = sendSpy.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
    };
    expect(arg.to).toBe("ops@example.com");
    // Scannable from a phone lock screen without opening it: that is the
    // entire point of the subject line.
    expect(arg.subject).toContain("purchase");
    expect(arg.subject.toLowerCase()).toContain("info");
    expect(arg.text).toContain("Deep Orbit sold for $59.00");
  });

  it("includes the detail fields so the mail is actionable on its own", async () => {
    await sendOperatorAlert({
      event: "dispute",
      severity: "critical",
      summary: "Chargeback opened",
      detail: { sessionId: "cs_live_abc", amount: 59, worldIds: "deep-orbit" },
    });

    const arg = sendSpy.mock.calls[0][0] as { text: string };
    expect(arg.text).toContain("cs_live_abc");
    expect(arg.text).toContain("deep-orbit");
  });

  it("falls back to the support address when no operator address is set", async () => {
    vi.stubEnv("OPERATOR_ALERT_EMAIL", "");
    vi.stubEnv("SUPPORT_EMAIL", "support@tensorcraft.app");

    await sendOperatorAlert({
      event: "refund",
      severity: "info",
      summary: "Refund processed",
    });

    const arg = sendSpy.mock.calls[0][0] as { to: string };
    expect(arg.to).toBe("support@tensorcraft.app");
  });

  it("does nothing when Resend is not configured", async () => {
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendOperatorAlert: fresh } = await import("../operator-alert");

    await expect(
      fresh({ event: "purchase", severity: "info", summary: "x" }),
    ).resolves.toBeUndefined();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  /**
   * Every call site is on a webhook path. An alert that throws would turn a
   * successful payment into a 500 and a Stripe retry, which is a far worse
   * outcome than a missed notification.
   */
  it("never throws when the mailer fails", async () => {
    sendSpy.mockRejectedValue(new Error("resend down"));

    await expect(
      sendOperatorAlert({ event: "purchase", severity: "info", summary: "x" }),
    ).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalled();
  });

  it("reports a Resend error result rather than assuming success", async () => {
    sendSpy.mockResolvedValue({
      data: null,
      error: { name: "rate_limit", message: "slow down" },
    });

    await sendOperatorAlert({
      event: "purchase",
      severity: "info",
      summary: "x",
    });

    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("escapes detail values, which can carry buyer-controlled text", async () => {
    await sendOperatorAlert({
      event: "purchase",
      severity: "info",
      summary: "sale",
      detail: { note: "<script>alert(1)</script>" },
    });

    const arg = sendSpy.mock.calls[0][0] as { html: string };
    expect(arg.html).not.toContain("<script>");
    expect(arg.html).toContain("&lt;script&gt;");
  });
});
