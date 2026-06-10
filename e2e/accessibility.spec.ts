import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "Landing", path: "/" },
  { name: "Auth", path: "/auth" },
  { name: "Terms", path: "/terms" },
  { name: "Privacy", path: "/privacy" },
  { name: "Themes", path: "/themes" },
  { name: "Theme Detail", path: "/themes/deep-orbit" },
  // The module route (/themes/{slug}/{module}) is a redirect shim to the
  // theme page, auditing it just re-audits Theme Detail and races axe
  // against the navigation. Pricing is audited instead.
  { name: "Pricing", path: "/pricing" },
  {
    name: "Lesson Viewer",
    path: "/themes/deep-orbit/foundations/introduction-to-tensors",
  },
];

test.describe("Accessibility audits", () => {
  for (const { name, path } of pages) {
    test(`${name} page (${path}) passes axe audit`, async ({ page }) => {
      // Skip entrance animations, axe samples computed colors, and an
      // element mid-fade reports a blended (lower-contrast) foreground.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      // framer-motion entrance animations don't all respect the emulated
      // reduced-motion preference; let them finish before sampling colors.
      await page.waitForTimeout(800);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
