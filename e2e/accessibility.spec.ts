import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "Landing", path: "/" },
  { name: "Sign In", path: "/auth/sign-in" },
  { name: "Sign Up", path: "/auth/sign-up" },
  { name: "Terms", path: "/terms" },
  { name: "Privacy", path: "/privacy" },
];

test.describe("Accessibility audits", () => {
  for (const { name, path } of pages) {
    test(`${name} page (${path}) passes axe audit`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
