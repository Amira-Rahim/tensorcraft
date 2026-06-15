import { test, expect } from "@playwright/test";

/**
 * End-of-lesson close, verified end-to-end: the Takeaways step (index 4) of a
 * deep-orbit lesson must render the new RecallPrompt + LessonRecap close.
 *
 * RecallPrompt sits above LessonRecap; revealing the answer exposes the
 * Got it / Review again controls; the recap shows its three sub-labels.
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
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");

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
    const reveal = page.getByRole("button", { name: /reveal answer/i }).first();
    await expect(reveal).toBeVisible();
    await reveal.click();

    await expect(
      page.getByRole("button", { name: /got it/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /review again/i }).first(),
    ).toBeVisible();
    // The Reveal Answer button is replaced by the revealed answer.
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
