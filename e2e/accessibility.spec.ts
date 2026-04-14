import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "Landing", path: "/" },
  { name: "Auth", path: "/auth" },
  { name: "Terms", path: "/terms" },
  { name: "Privacy", path: "/privacy" },
  { name: "Themes", path: "/themes" },
  { name: "Theme Detail", path: "/themes/deep-orbit" },
  { name: "Module Overview", path: "/themes/deep-orbit/foundations" },
  {
    name: "Lesson Viewer",
    path: "/themes/deep-orbit/foundations/introduction-to-tensors",
  },
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
