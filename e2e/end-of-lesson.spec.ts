import { test, expect } from "@playwright/test";

/**
 * End-of-lesson close, verified end-to-end: the Takeaways step of a
 * deep-orbit lesson must render the RecallPrompt + LessonRecap close.
 *
 * RecallPrompt sits above LessonRecap; every checked part must be resolved
 * before the recap appears. Incorrect attempts remain retryable.
 *
 * In the Deep Orbit layout (clarity fix 14, 2026-10-12) the recall card's
 * visible heading reads "Check what you learned", and lesson 1's LessonRecap
 * renders as DeepOrbitRecap's "Reading the shape" section: a short reading of
 * the shape beside a figure, in place of the shared panel's "What you
 * learned", "The bridge" and "You can now" labels.
 *
 * The step index persists in localStorage under the lesson slug, seeded
 * before the page's first render reads it (lessonStepKeys in
 * apps/web/lib/lesson-phases.ts). "4" is the six-step layout's Takeaways
 * index, which restoreLessonSteps migrates to Takeaways in the five-step
 * layout.
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
      .getByRole("heading", { name: "Check what you learned", exact: true })
      .first();
    const recap = page.getByRole("region", { name: "Reading the shape" });
    await expect(recall).toBeVisible({ timeout: 15000 });
    await expect(recap).toHaveCount(0);

    const check = page.getByRole("button", {
      name: "Check answers",
      exact: true,
    });
    await expect(check).toBeDisabled();
    // Since content fix 10 (2026-10-18) the card asks about
    // tf.tensor(streamValues), Demir's 12 selected readings, so the expected
    // shape is [12]. [1, 12] is the plausible slip: an extra leading axis.
    const shape = page.getByRole("textbox", {
      name: "What is this tensor’s shape?",
    });
    // The Deep Orbit layout sets "No" on its own line, so the radio's
    // accessible name has no comma.
    const noTraining = page.getByRole("radio", {
      name: "No it only creates a tensor.",
    });
    await shape.fill("[1, 12]");
    await noTraining.check();
    await check.click();
    await expect(
      page.getByRole("status").filter({ hasText: "1 of 2 correct" }),
    ).toBeVisible();
    await expect(recap).toHaveCount(0);
    await expect(shape).toHaveAttribute("aria-invalid", "true");
    await expect(noTraining).toBeDisabled();

    await shape.fill(" [ 12 ] ");
    await page
      .getByRole("button", { name: "Check again", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "All answers are correct." }),
    ).toBeVisible();
    await expect(recap).toBeVisible();
    await expect(shape).toBeDisabled();
    await expect(shape).toHaveValue(" [ 12 ] ");
    await expect(
      page.getByRole("button", { name: "Got it", exact: true }),
    ).toHaveCount(0);
    const recallBox = await recall.boundingBox();
    const recapBox = await recap.boundingBox();
    expect(recallBox).not.toBeNull();
    expect(recapBox).not.toBeNull();
    expect(recallBox!.y).toBeLessThan(recapBox!.y);

    // The recap shows its parts: the heading above, the note that ties the
    // shape back to the recall's second answer, and the figure.
    await expect(
      recap.getByText("Training a model is a separate step."),
    ).toBeVisible();
    await expect(recap.getByRole("figure")).toBeVisible();
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
    // The saved step is restored in a client effect, so the server HTML is
    // the Briefing. Clicking before the restore lands hit the Briefing's
    // Continue (flaky on Linux CI, 2026-10-25). Legacy index 4 migrates to
    // Takeaways, step 4 of 5.
    await expect(
      page.getByRole("group", { name: /^Step 4 of 5/ }),
    ).toBeVisible();

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
    // The saved step is restored in a client effect, so the server HTML is
    // the Briefing. Clicking before the restore lands hit the Briefing's
    // Continue (flaky on Linux CI, 2026-10-25). Legacy index 4 migrates to
    // Takeaways, step 4 of 5.
    await expect(
      page.getByRole("group", { name: /^Step 4 of 5/ }),
    ).toBeVisible();

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
