import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
        const shape = card.getByRole("textbox");
        await shape.fill("[1, 3]");
        const radio = card.getByRole("radio", {
          name: "No, it only creates a tensor.",
        });
        await radio.focus();
        await page.keyboard.press("Space");
        await card.getByRole("button", { name: "Check answers" }).click();
        await expect(card.getByRole("status")).toHaveText(/1 of 2 correct/);
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
        await shape.fill("[3]");
        await shape.press("Enter");
        await expect(card.getByRole("status")).toHaveText(
          /All answers are correct/,
        );
        await expect(
          page.getByText("Lesson Recap", { exact: true }),
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

test("the image-shape lesson independently checks numbers, shapes and axis meanings", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_tensor-shapes", "4");
    localStorage.setItem("tc_step_max_deep-orbit_tensor-shapes", "4");
  });
  await page.goto("/worlds/deep-orbit/foundations/tensor-shapes");
  const card = page.getByRole("form", { name: "Knowledge check" });
  await card
    .getByRole("textbox", {
      name: "How many images are in a batch with shape [8, 224, 224, 3]?",
    })
    .fill("eight");
  await card
    .getByRole("textbox", {
      name: "What is the shape of one image in that batch?",
    })
    .fill("[224, 224, 3]");
  await card.getByRole("radio", { name: "Height, width, channels." }).check();
  await card.getByRole("button", { name: "Check answers" }).click();
  await expect(card.getByRole("status")).toHaveText(/2 of 3 correct/);
  await expect(page.getByText("Lesson Recap", { exact: true })).toHaveCount(0);
  await card
    .getByRole("textbox", {
      name: "How many images are in a batch with shape [8, 224, 224, 3]?",
    })
    .fill("8.0");
  await card.getByRole("button", { name: "Check again" }).click();
  await expect(card.getByRole("status")).toHaveText(/All answers are correct/);
  await expect(page.getByText("Lesson Recap", { exact: true })).toBeVisible();
});
