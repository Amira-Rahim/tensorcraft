import { test, expect } from "@playwright/test";

/**
 * WCAG 1.4.10 (Reflow) gate, audit run #6 follow-up (2026-07-15).
 *
 * 320 CSS pixels is the width the success criterion names: it is a 1280px
 * viewport at 400% zoom, which is how a low-vision user reads a page. Content
 * must reflow to it without a horizontal scrollbar, because two-dimensional
 * scrolling to read one line of text is the failure the criterion exists to
 * prevent.
 *
 * The rule is about the PAGE, not its parts. Wide content (tables, code
 * blocks, diagrams) is allowed to scroll inside its own container; what must
 * never scroll sideways is the document.
 */

const VIEWPORT_320 = { width: 320, height: 800 };

const routes = [
  { name: "Landing", path: "/" },
  { name: "Worlds", path: "/worlds" },
  { name: "World Detail", path: "/worlds/deep-orbit" },
  { name: "Pricing", path: "/pricing" },
  { name: "Auth", path: "/auth" },
  { name: "Learn", path: "/learn" },
  {
    name: "Lesson Viewer",
    path: "/worlds/deep-orbit/foundations/introduction-to-tensors",
  },
];

test.describe("Reflow at 320px (WCAG 1.4.10)", () => {
  test.use({ viewport: VIEWPORT_320 });

  for (const { name, path } of routes) {
    test(`${name} (${path}) does not scroll horizontally at 320px`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForTimeout(800);

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });

      // 1px of slack: sub-pixel layout rounding is not a reflow failure.
      expect(
        overflow.scrollWidth,
        `${name} overflows its viewport by ${
          overflow.scrollWidth - overflow.clientWidth
        }px at 320px wide. The document must not scroll sideways; if something ` +
          `genuinely needs the width, give THAT element overflow-x:auto rather ` +
          `than letting it push the page.`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }

  /**
   * NOT COVERED: /dashboard.
   *
   * It 307s to /auth?redirectTo=%2Fdashboard without a session, so a test that
   * "checks the dashboard" here would silently measure the auth page and pass
   * while proving nothing. The run #6 a11y report claimed the dashboard cannot
   * reflow to 320px; that claim is UNVERIFIED, not refuted, and it stays open
   * until this suite can authenticate. Wiring a session into e2e is the
   * prerequisite, not a wider timeout.
   */
  test.fixme("Dashboard reflows at 320px (needs an authenticated e2e session)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
