/**
 * Captures a real screenshot of the free lesson page for the landing page's
 * "What You'll Build" section. Re-run whenever the lesson UI changes:
 *
 *   node scripts/capture-lesson-shot.mjs   (dev server must be on :3000)
 *
 * Output: apps/web/public/landing/lesson-screenshot.png (2x for retina).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const URL =
  process.env.LESSON_URL ??
  "http://localhost:3000/themes/deep-orbit/foundations/introduction-to-tensors";
const OUT = "apps/web/public/landing/lesson-screenshot.png";

mkdirSync("apps/web/public/landing", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});

await page.goto(URL, { waitUntil: "networkidle" });
// Dismiss the cookie banner so it doesn't cover the lesson content.
const essential = page.getByRole("button", { name: /essential only/i });
if (await essential.isVisible().catch(() => false)) {
  await essential.click();
}
// Let fonts/canvas effects settle so the shot isn't mid-paint.
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT });
await browser.close();
console.log(`saved ${OUT}`);
