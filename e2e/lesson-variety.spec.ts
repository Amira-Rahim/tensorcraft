import { test, expect } from "@playwright/test";

/**
 * P2 structure-variety machinery, verified through the full stack: velite
 * frontmatter → lesson page → SceneCard. Unit tests cover the components;
 * this proves a real converted lesson ships its FORMAT tag and slugline
 * (the round-4 lesson: schema fields can exist while the page renders
 * nothing).
 */
test.describe("Structure variety: pattern + scene render end-to-end", () => {
  test("foundations/tensor-operations shows FORMAT tag and slugline", async ({
    page,
  }) => {
    await page.goto("/themes/deep-orbit/foundations/tensor-operations");

    // SceneCard rail: scene slugline fed from frontmatter.
    await expect(page.getByText("Archimedes, Bridge").first()).toBeVisible({
      timeout: 15000,
    });

    // FORMAT tag: pattern=broken_code_first renders its learner-facing label.
    const tag = page.getByTestId("pattern-format-tag");
    await expect(tag).toBeVisible();
    await expect(tag).toContainText(/Field repair/i);
  });

  test("the free-tier BossBeat renders without leaking its stance labels", async ({
    page,
  }) => {
    await page.goto("/themes/deep-orbit/foundations/normalization");
    const beat = page.getByTestId("boss-beat-option-dominant");
    await expect(beat).toBeVisible({ timeout: 15000 });
    // The stance enum must never appear as text anywhere in the beat UI.
    for (const stance of ["cooperate", "defect", "random", "dominant"]) {
      await expect(
        page.getByTestId(`boss-beat-option-${stance}`),
      ).not.toContainText(stance, { ignoreCase: true });
    }
  });

  test("a standard-pattern lesson renders no FORMAT tag", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    // Scene renders (slugline machinery on), FORMAT tag does not.
    await expect(page.getByText("Archimedes, Bridge").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("pattern-format-tag")).toHaveCount(0);
  });
});
