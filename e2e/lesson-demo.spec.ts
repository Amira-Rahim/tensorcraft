import { test, expect } from "@playwright/test";

/**
 * Free-tier magic moment, verified end-to-end: the Consequence step of
 * foundations/normalization must load the real 4 KB preview model and run
 * REAL TensorFlow.js inference in the browser, sample 7741 lands at ~51%.
 *
 * The lesson step index persists in localStorage (`tc_step_{world}_{lesson}`),
 * so the test jumps straight to step 5 (Consequence) rather than solving
 * the exercise gate.
 */
test.describe("DeepScanDemo: live inference on the free tier", () => {
  test("runs the real model and surfaces sample 7741 at ~51%", async ({
    page,
  }) => {
    // Seed the step BEFORE the lesson page's first render reads it.
    await page.addInitScript(() => {
      // Key uses the frontmatter slug (normalization), not the slugified
      // title (data-normalization) - see getStorageKey in lesson-steps.tsx.
      localStorage.setItem("tc_step_deep-orbit_normalization", "5");
      localStorage.setItem("tc_step_max_deep-orbit_normalization", "5");
    });
    await page.goto("/worlds/deep-orbit/foundations/normalization");

    // Consequence step renders the epilogue scene with the demo inside.
    await expect(page.getByTestId("epilogue")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("deep-scan-demo")).toBeVisible();

    // Real tfjs + real model + staged reveal: give it time, then assert
    // the actual inference result, not a mock.
    const verdict = page.getByTestId("demo-verdict-7741");
    await expect(verdict).toBeVisible({ timeout: 30000 });
    await expect(verdict).toContainText(/NEITHER/);

    // The displayed score must be the model's ~51%, proves real inference.
    const row = page.locator("div", { has: verdict }).last();
    await expect(row).toContainText(/5[01]\.\d%/);
  });
});
