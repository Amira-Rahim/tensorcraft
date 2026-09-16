import { test, expect } from "@playwright/test";
import { seedDueReview, REVIEW_LESSON } from "../review-fixture";
for (const colorScheme of ["light", "dark"] as const) {
  test(`review warm-up ${colorScheme}`, async ({ page }) => {
    test.skip(process.env.RUN_VISUAL !== "1", "Opt-in visual comparison");
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await seedDueReview(page);
    await page.goto(REVIEW_LESSON);
    const warmup = page.getByRole("region", { name: /Warm-up/ });
    await expect(warmup).toBeVisible();
    await expect(warmup).toHaveScreenshot(`review-warmup-${colorScheme}.png`);
  });
}
