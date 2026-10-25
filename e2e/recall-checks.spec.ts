import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Takeaways recall in the Deep Orbit lesson layout (clarity fix 14,
 * 2026-10-12). The card's visible heading reads "Check what you learned" and
 * the form keeps its "Knowledge check" name. A Yes/No option sets its first
 * word on its own line, so the radio's accessible name has no comma. Once
 * every check is settled, DeepOrbitRecap follows the card in place of the
 * shared "Lesson Recap" panel.
 *
 * The seeded step value "4" is the six-step layout's Takeaways index, which
 * restoreLessonSteps (apps/web/lib/lesson-phases.ts) migrates to Takeaways in
 * the five-step layout.
 */
for (const viewport of [
  { width: 320, height: 800 },
  { width: 1440, height: 1000 },
]) {
  for (const colorScheme of ["dark", "light"] as const) {
    test.describe(`Recall at ${viewport.width}px in ${colorScheme}`, () => {
      test.use({ viewport, colorScheme, reducedMotion: "reduce" });
      test("checks keyboard answers, fits the screen and exposes accessible feedback", async ({
        page,
      }, testInfo) => {
        await page.addInitScript(() => {
          localStorage.setItem("tc-cookie-consent", "declined");
          localStorage.setItem(
            "tc_step_deep-orbit_introduction-to-tensors",
            "4",
          );
          localStorage.setItem(
            "tc_step_max_deep-orbit_introduction-to-tensors",
            "4",
          );
        });
        await page.goto(
          "/worlds/deep-orbit/foundations/introduction-to-tensors",
        );
        const card = page.getByRole("form", { name: "Knowledge check" });
        await expect(card).toBeVisible();
        // Since content fix 10 (2026-10-18) the card asks about
        // tf.tensor(streamValues), Demir's 12 selected readings, so the
        // expected shape is [12]. [1, 12] is the plausible slip: an extra
        // leading axis around the same 12 values.
        const shape = card.getByRole("textbox", {
          name: "What is this tensor’s shape?",
        });
        await shape.fill("[1, 12]");
        const radio = card.getByRole("radio", {
          name: "No it only creates a tensor.",
        });
        await radio.focus();
        await page.keyboard.press("Space");
        await expect(radio).toBeChecked();
        await card.getByRole("button", { name: "Check answers" }).click();
        await expect(card.getByRole("status")).toHaveText(/1 of 2 correct/);
        await expect(shape).toHaveAttribute("aria-invalid", "true");
        await expect(shape).toHaveAccessibleDescription(
          /Not quite\. That’s incorrect\./,
        );
        const audit = await new AxeBuilder({ page })
          .include(".review-check")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        expect(audit.violations).toEqual([]);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await card.screenshot({
          path: testInfo.outputPath("partial-answer.png"),
        });
        await shape.fill("[12]");
        await shape.press("Enter");
        await expect(card.getByRole("status")).toHaveText(
          /All answers are correct/,
        );
        // Lesson 1's recap is its "Reading the shape" section.
        await expect(
          page.getByRole("region", { name: "Reading the shape" }),
        ).toBeVisible();
        expect(
          (
            await new AxeBuilder({ page })
              .include(".review-check")
              .withTags(["wcag2a", "wcag2aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
      });
    });
  }
}

test("the tensor-shapes recall independently checks a shape, the sensor layout and a number", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_tensor-shapes", "4");
    localStorage.setItem("tc_step_max_deep-orbit_tensor-shapes", "4");
  });
  await page.goto("/worlds/deep-orbit/foundations/tensor-shapes");
  // Content fix 3 (2026-10-16) rebuilt this recall around Demir's recording:
  // [6, 10, 14, 7, 12, 13] holds sensors A, B and C at two moments. The
  // checks ask for the moment-by-sensor shape, how to give the chart one row
  // per sensor, and sensor B's reading at the second moment.
  const card = page.getByRole("form", { name: "Knowledge check" });
  const recap = page.getByRole("region", { name: "What you learned" });
  const grid = card.getByRole("textbox", {
    name: "What shape gives one row per moment and one column per sensor?",
  });
  const layout = card.getByRole("group", {
    name: "Your grid has one row per moment. How do you give the chart one row per sensor?",
  });
  const reading = card.getByRole("textbox", {
    name: "What is sensor B's reading at the second moment?",
  });
  await grid.fill("[2, 3]");
  // The plausible slip: a reshape to [3, 2] has the requested shape, but
  // every row mixes sensors.
  await layout
    .getByRole("radio", { name: "Reshape the grid to [3, 2]." })
    .check();
  // A number written as a word is not graded as a number.
  await reading.fill("twelve");
  await card.getByRole("button", { name: "Check answers" }).click();
  await expect(card.getByRole("status")).toHaveText(/1 of 3 correct/);
  await expect(recap).toHaveCount(0);
  await expect(grid).toBeDisabled();
  await expect(layout.getByText("Not quite. That’s incorrect.")).toBeVisible();
  await expect(layout).toHaveAccessibleDescription(/Each row mixes sensors\./);
  await expect(reading).toHaveAttribute("aria-invalid", "true");
  await layout.getByRole("radio", { name: "Transpose the grid." }).check();
  await reading.fill("12.0");
  await card.getByRole("button", { name: "Check again" }).click();
  await expect(card.getByRole("status")).toHaveText(/All answers are correct/);
  await expect(recap).toBeVisible();
});
