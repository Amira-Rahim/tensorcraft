import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, colorScheme] of [
  [1440, "dark"],
  [390, "light"],
] as const) {
  test(`normalization on the real lesson, ${width}px ${colorScheme}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      "/worlds/deep-orbit/foundations/normalization?start=concept",
    );
    const box = page.getByTestId("experiment-normalization");
    await expect(box).toHaveCount(1);
    await page
      .getByText("Practice: a different scaler and reading", { exact: true })
      .click();
    await expect(box).toBeVisible();
    await box.getByRole("textbox").fill("24,2");
    await box
      .getByRole("button", { name: "Check prediction", exact: true })
      .click();
    await expect(box.getByRole("status")).toContainText(
      "The calculation returns 1, 1",
    );
    await box.getByLabel("Preprocessing", { exact: true }).selectOption("0");
    await box.getByRole("textbox").fill("24,2");
    await box
      .getByRole("button", { name: "Check prediction", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(box.getByRole("status")).toContainText("matches");
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(box).toHaveCount(0);
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await page
      .getByText("Practice: a different scaler and reading", { exact: true })
      .click();
    await expect(box.getByLabel("Preprocessing", { exact: true })).toHaveValue(
      "0",
    );
    await box.getByRole("button", { name: "Try a changed case" }).click();
    await box.getByRole("textbox").fill("2,2");
    await box
      .getByRole("button", { name: "Check prediction", exact: true })
      .click();
    await expect(box.getByRole("status")).toContainText("matches");
    await page.reload();
    await page
      .getByText("Practice: a different scaler and reading", { exact: true })
      .click();
    await expect(box.getByRole("textbox")).toHaveValue("2,2");
    await expect(box).toContainText("First: matched before help");
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
    ).toBeDisabled();
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="experiment-normalization"]')
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await box.screenshot({
      path: testInfo.outputPath(`normalization-${width}-${colorScheme}.png`),
    });
    expect(errors).toEqual([]);
  });
}
