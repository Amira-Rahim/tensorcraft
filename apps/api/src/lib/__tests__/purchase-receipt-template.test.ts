import { describe, expect, it } from "vitest";
import { renderPurchaseReceipt } from "../purchase-receipt-template";

const receipt = {
  worldIds: ["deep-orbit"],
  amount: 50,
  sessionId: "cs_test_preview_12345678",
  purchasedAt: new Date("2026-10-14T10:05:00Z"),
};

describe("renderPurchaseReceipt", () => {
  it("keeps the subject, receipt details, refund terms and support in both formats", () => {
    const content = renderPurchaseReceipt(receipt);
    expect(content.subject).toBe("Deep Orbit purchase confirmed | Tensorcraft");
    for (const format of [content.html, content.text]) {
      expect(format).toContain("Deep Orbit is yours.");
      expect(format).toContain("$50.00");
      expect(format).toContain("USD");
      expect(format).toContain("Oct 14, 2026 at 10:05 UTC");
      expect(format).toContain("TC-12345678");
      expect(format).toContain("support@tensorcraft.app");
      expect(format).toContain("Refunds are available for 5 days.");
      expect(format).not.toContain(receipt.sessionId);
    }
  });

  it("opens the purchased launched world's mission map", () => {
    const content = renderPurchaseReceipt(receipt, {
      appUrl: "https://example.com/",
    });
    expect(content.html).toContain(
      'href="https://example.com/worlds/deep-orbit"',
    );
    expect(content.text).toContain(
      "Open mission map: https://example.com/worlds/deep-orbit",
    );
    expect(content.html).toContain("Open mission map");
    expect(content.html).not.toContain("Start here");
  });

  it("uses the dashboard when the purchased world is not available", () => {
    const content = renderPurchaseReceipt({
      ...receipt,
      worldIds: ["unknown-world"],
    });
    expect(content.html).toContain('href="https://tensorcraft.app/dashboard"');
    expect(content.text).toContain(
      "Open dashboard: https://tensorcraft.app/dashboard",
    );
    expect(content.html).not.toContain("/worlds/unknown-world");
    expect(content.subject).toBe("Tensorcraft purchase confirmed");
    expect(content.html).toContain("Your purchase is confirmed.");
    expect(content.html).toContain(
      "Your dashboard shows the courses available to you.",
    );
    expect(content.html).not.toContain("are now open");
    expect(content.text).not.toContain("are now open");
    expect(content.text).toContain("What you bought: Unknown World");
  });

  it("escapes display values and attribute values in HTML", () => {
    const content = renderPurchaseReceipt(
      {
        ...receipt,
        worldIds: ['<img src=x onerror="alert(1)">'],
        sessionId: "cs_test_<img>&\"'",
      },
      { supportEmail: 'support+"<tag>@example.com' },
    );
    expect(content.html).not.toContain("<img");
    expect(content.html).not.toContain("<tag>");
    expect(content.html).toContain("&lt;img");
    expect(content.html).toContain("&quot;");
    expect(content.html).toContain("&amp;");
    expect(content.html).toContain("&#39;");
  });

  it("does not create a button with an unsafe application URL", () => {
    const content = renderPurchaseReceipt(receipt, {
      appUrl: "javascript:alert(1)",
    });
    expect(content.html).toContain(
      'href="https://tensorcraft.app/worlds/deep-orbit"',
    );
    expect(content.html).not.toContain("javascript:");
  });

  it("names available access while keeping every purchased world in the receipt", () => {
    const content = renderPurchaseReceipt({
      ...receipt,
      worldIds: ["deep-orbit", "code-garden"],
    });
    expect(content.html).toContain("Deep Orbit is yours.");
    expect(content.html).toContain(
      "All lessons and exercises in Deep Orbit are now open.",
    );
    expect(content.html).not.toContain("Code Garden are now open");
    expect(content.text).toContain("What you bought: Deep Orbit, Code Garden");
  });
});
