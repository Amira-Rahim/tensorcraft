import path from "node:path";
import { test, expect } from "@playwright/test";
import { seedDueReview, REVIEW_WARMUP_LESSON } from "../review-fixture";

// Hides the Next.js dev-overlay badge at capture time; see screenshot.css.
const SCREENSHOT_STYLE = path.join(__dirname, "screenshot.css");

for (const colorScheme of ["light", "dark"] as const) {
  test(`review warm-up ${colorScheme}`, async ({ page }) => {
    test.skip(process.env.RUN_VISUAL !== "1", "Opt-in visual comparison");
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await seedDueReview(page);
    // Lesson 2, because the seeded prompt is lesson 1's and a warm-up only
    // recalls earlier lessons (2026-09-22).
    await page.goto(REVIEW_WARMUP_LESSON);
    const warmup = page.getByRole("region", { name: /Warm-up/ });
    await expect(warmup).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(warmup).toHaveScreenshot(`review-warmup-${colorScheme}.png`, {
      stylePath: SCREENSHOT_STYLE,
    });
  });
}
