import { test, expect } from "@playwright/test";

/**
 * End-of-lesson close, verified end-to-end: the Takeaways step (index 4) of a
 * deep-orbit lesson must render the new RecallPrompt + LessonRecap close.
 *
 * RecallPrompt sits above LessonRecap; revealing the answer exposes the
 * Got it / Needs work controls; the recap shows its three sub-labels.
 *
 * The step index persists in localStorage under the slugified lesson TITLE
 * ("Introduction to Tensors" -> introduction-to-tensors), seeded before the
 * page's first render reads it (see getStorageKey in lesson-steps.tsx).
 */
test.describe("End-of-lesson close: RecallPrompt + LessonRecap", () => {
  test("Takeaways step shows recall above recap, reveal, and recap labels", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "4");
      localStorage.setItem(
        "tc_step_max_deep-orbit_introduction-to-tensors",
        "4",
      );
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");

    // Both close blocks render on the Takeaways step.
    const recall = page.getByText("Recall Prompt", { exact: true }).first();
    const recap = page.getByText("Lesson Recap", { exact: true }).first();
    await expect(recall).toBeVisible({ timeout: 15000 });
    await expect(recap).toBeVisible();

    // RecallPrompt appears above LessonRecap in the document.
    const recallBox = await recall.boundingBox();
    const recapBox = await recap.boundingBox();
    expect(recallBox).not.toBeNull();
    expect(recapBox).not.toBeNull();
    expect(recallBox!.y).toBeLessThan(recapBox!.y);

    // Reveal the answer; the answer text and the result controls appear.
    const reveal = page.getByRole("button", { name: /^check$/i }).first();
    await expect(reveal).toBeVisible();
    await expect(reveal).toBeDisabled();
    await page
      .getByRole("textbox")
      .first()
      .fill("A tensor holds numeric data with a shape.");
    await reveal.click();

    await expect(
      page.getByRole("button", { name: /got it/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /needs work/i }).first(),
    ).toBeVisible();
    // The Check button is replaced by the revealed answer.
    await expect(reveal).toBeHidden();

    // The recap shows its three sub-labels.
    await expect(
      page.getByText("What you learned", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("The bridge", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("You can now", { exact: true }).first(),
    ).toBeVisible();
  });
});

/**
 * The patch award moment, end to end on the guest path: with every OTHER
 * foundations lesson recorded as a guest completion, walking the last
 * remaining lesson to the Consequence step reveals the module's mission
 * patch. Guest records are the one completion state an unauthenticated
 * e2e can seed, and they exercise the same predicate the authed path uses.
 */
test.describe("Patch award moment", () => {
  test("closing out the module reveals the mission patch", async ({ page }) => {
    await page.addInitScript(() => {
      const done: Record<string, string> = {};
      for (const lesson of [
        "tensor-shapes",
        "tensor-operations",
        "data-loading",
        "normalization",
      ]) {
        done[`deep-orbit/foundations/${lesson}`] = new Date().toISOString();
      }
      localStorage.setItem("tc_guest_completed_v1", JSON.stringify(done));
      localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "4");
      localStorage.setItem(
        "tc_step_max_deep-orbit_introduction-to-tensors",
        "4",
      );
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");

    await page
      .getByRole("button", { name: /continue|complete/i })
      .first()
      .click();

    const award = page.getByTestId("patch-award");
    await expect(award).toBeVisible({ timeout: 15000 });
    await expect(award.getByText("Sector Complete")).toBeVisible();
    await expect(award.getByText("Mission patch earned.")).toBeVisible();
    await expect(award.getByTestId("module-patch")).toBeVisible();
  });

  test("a mid-module completion shows no award", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "4");
      localStorage.setItem(
        "tc_step_max_deep-orbit_introduction-to-tensors",
        "4",
      );
      localStorage.setItem("tc-cookie-consent", "declined");
    });
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");

    await page
      .getByRole("button", { name: /continue|complete/i })
      .first()
      .click();

    await expect(
      page.getByText("Mission Complete", { exact: false }).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("patch-award")).toHaveCount(0);
  });
});
