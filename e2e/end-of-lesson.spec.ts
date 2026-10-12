import { test, expect } from "@playwright/test";

/**
 * End-of-lesson close, verified end-to-end: the Takeaways step (index 4) of a
 * deep-orbit lesson must render the new RecallPrompt + LessonRecap close.
 *
 * RecallPrompt sits above LessonRecap; every checked part must be resolved
 * before the recap appears. Incorrect attempts remain retryable.
 *
 * The step index persists in localStorage under the slugified lesson TITLE
 * ("Introduction to Tensors" -> introduction-to-tensors), seeded before the
 * page's first render reads it (see getStorageKey in lesson-steps.tsx).
 */
test.describe("End-of-lesson close: RecallPrompt + LessonRecap", () => {
  test("Takeaways checks both answers and reveals the recap after correction", async ({
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

    // The recall card renders first, alone; the recap waits for it (spec
    // 2026-09-24, section 2).
    const recall = page
      .getByRole("heading", { name: "Knowledge check", exact: true })
      .first();
    const recap = page.getByText("Lesson Recap", { exact: true }).first();
    await expect(recall).toBeVisible({ timeout: 15000 });
    await expect(recap).toHaveCount(0);

    const check = page.getByRole("button", {
      name: "Check answers",
      exact: true,
    });
    await expect(check).toBeDisabled();
    const shape = page.getByRole("textbox", {
      name: "What is the shape of tf.tensor([0.2, 0.4, 0.6])?",
    });
    await shape.fill("[1, 3]");
    await page
      .getByRole("radio", { name: "No, it only creates a tensor." })
      .check();
    await check.click();
    await expect(
      page.getByRole("status").filter({ hasText: "1 of 2 correct" }),
    ).toBeVisible();
    await expect(recap).toHaveCount(0);
    await expect(shape).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByRole("radio", { name: "No, it only creates a tensor." }),
    ).toBeDisabled();

    await shape.fill(" [ 3 ] ");
    await page
      .getByRole("button", { name: "Check again", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "All answers are correct." }),
    ).toBeVisible();
    await expect(recap).toBeVisible();
    await expect(shape).toBeDisabled();
    await expect(shape).toHaveValue(" [ 3 ] ");
    await expect(
      page.getByRole("button", { name: "Got it", exact: true }),
    ).toHaveCount(0);
    const recallBox = await recall.boundingBox();
    const recapBox = await recap.boundingBox();
    expect(recallBox).not.toBeNull();
    expect(recapBox).not.toBeNull();
    expect(recallBox!.y).toBeLessThan(recapBox!.y);

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

    await expect(page.getByText(/mission complete/i).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("patch-award")).toHaveCount(0);
  });
});
