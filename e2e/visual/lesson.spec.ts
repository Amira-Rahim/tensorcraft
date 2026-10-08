import path from "node:path";
import { test, expect } from "@playwright/test";

/*
  Lesson route baselines: the Briefing and both states of the Concept
  preview at 1,440 and 390. Dark scheme, scene resolved, reduced motion,
  consent declined.
*/

const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const shouldRun = process.env.RUN_VISUAL === "1";
// Hides the Next.js dev-overlay badge at capture time; see screenshot.css.
const SCREENSHOT_STYLE = path.join(__dirname, "screenshot.css");

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["phone", { width: 390, height: 844 }],
] as const) {
  for (const [stepName, step] of [
    ["briefing", 0],
    ["concept", 1],
  ] as const) {
    test(`lesson ${stepName} ${name}`, async ({ page }) => {
      test.skip(!shouldRun, "Opt-in visual comparison");
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.addInitScript((s) => {
        localStorage.setItem("tc-cookie-consent", "declined");
        localStorage.setItem("tc-script-skip", "1");
        localStorage.setItem(
          "tc_step_deep-orbit_introduction-to-tensors",
          String(s),
        );
        localStorage.setItem(
          "tc_step_max_deep-orbit_introduction-to-tensors",
          String(s),
        );
        // The text briefing, so a future scene clip cannot change the image
        // (key from apps/web/lib/briefing-variant.ts).
        localStorage.setItem("tc-briefing-variant", "text");
      }, step);
      // domcontentloaded is enough: the step is restored in a client effect
      // after load, so the step's own marker below is what the test waits on.
      await page.goto(LESSON, { waitUntil: "domcontentloaded" });
      // data-script-state exists only on the Briefing root; the Concept
      // step's settled marker is its reading column.
      if (step === 0) {
        await expect(page.locator("[data-script-state='done']")).toBeAttached();
        // The plate image is lazy and removes itself on error: wait for it.
        await expect
          .poll(() =>
            page
              .locator(
                '.lesson-story-plate > [data-testid="scene-portrait"] > img',
              )
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
      } else {
        await expect(
          page.locator('.lesson-step-content[data-layout="reading"]'),
        ).toBeVisible();
      }
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      // The step container's script focus ring is transient state, not layout.
      await page.evaluate(() =>
        (document.activeElement as HTMLElement | null)?.blur(),
      );
      await expect(page).toHaveScreenshot(`lesson-${stepName}-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
        stylePath: SCREENSHOT_STYLE,
      });
      if (step === 1) {
        await page.getByRole("button", { name: "Calculate average" }).click();
        await expect(page.locator(".iv-creation-status")).toContainText(
          "Average reading 0.544",
        );
        await page.evaluate(() =>
          (document.activeElement as HTMLElement | null)?.blur(),
        );
        await expect(page).toHaveScreenshot(
          `lesson-concept-created-${name}.png`,
          {
            fullPage: true,
            maxDiffPixelRatio: 0.001,
            stylePath: SCREENSHOT_STYLE,
          },
        );
      }
    });
  }
}
