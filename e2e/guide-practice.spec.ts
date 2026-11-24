import { expect, test, type Page } from "@playwright/test";

async function openPractice(
  page: Page,
  name: string,
  input: "keyboard" | "touch",
) {
  await page.goto("/guides");
  const practice = page.getByRole("region", { name: "Hands-on practice" });
  const link = practice.getByRole("link", { name, exact: true });
  await expect(link).toBeVisible();
  if (input === "touch") {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await link.tap();
    return;
  }
  // Walk the actual tab order, including the site navigation.
  for (let step = 0; step < 30; step++) {
    await page.keyboard.press("Tab");
    if (await link.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
}

for (const input of ["keyboard", "touch"] as const) {
  test.describe(`Signed-out guide practice with ${input}`, () => {
    test.use({
      hasTouch: input === "touch",
      isMobile: input === "touch",
      viewport:
        input === "touch"
          ? { width: 375, height: 667 }
          : { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });

    test("three practice links open usable activities", async ({ page }) => {
      test.setTimeout(120_000);
      await page.addInitScript(() =>
        localStorage.setItem("tc-cookie-consent", "declined"),
      );
      await openPractice(page, "Run the room occupancy demo", input);
      const training = page.getByRole("region", {
        name: "Training and validation in your browser",
      });
      // A link to the top of the long project guide could still pass a visibility check.
      await expect(
        training.getByRole("heading", { level: 2 }),
      ).toBeInViewport();
      await training.getByRole("button", { name: "Train and compare" }).click();
      await expect(
        training.getByRole("row", { name: "False alarms 36 20" }),
      ).toBeVisible();

      await openPractice(page, "Predict a row of sensor readings", input);
      const experiment = page.getByTestId("channel-layout-experiment");
      await experiment
        .getByLabel("Which four readings go in the second row?")
        .fill("3,18,7,8");
      await experiment
        .getByRole("button", { name: "Check prediction" })
        .click();
      await expect(
        experiment.getByText("Correct!", { exact: true }),
      ).toBeVisible();

      await openPractice(page, "Write and test JavaScript", input);
      await expect(
        page.getByRole("group", { name: "Step 3 of 5: Challenge" }),
      ).toBeVisible();
      await expect(page.locator(".cm-content").first()).toBeEditable();
      await expect(
        page.getByRole("button", { name: "Run Tests", exact: true }),
      ).toBeEnabled();
    });
  });
}
