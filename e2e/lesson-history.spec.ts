import { test, expect } from "@playwright/test";

test("phase history preserves the document and experiment draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc-script-skip", "1");
  });
  await page.goto("/worlds/deep-orbit/foundations/normalization?start=concept");
  const experiment = page.getByTestId("experiment-normalization");
  await page
    .getByText("Practice: a different scaler and reading", { exact: true })
    .click();
  await expect(experiment).toBeVisible();
  await page.evaluate(
    () => (document.documentElement.dataset.historyProbe = "same-document"),
  );
  await experiment.getByRole("textbox").fill("1,1");
  await experiment
    .getByRole("button", { name: "Check prediction", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(experiment.getByRole("status")).toContainText("matches");
  // The lesson nav button reads "Continue" with no arrow since 2026-10-19.
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(experiment).toHaveCount(0);
  await page.goBack();
  await page
    .getByText("Practice: a different scaler and reading", { exact: true })
    .click();
  await expect(experiment.getByRole("textbox")).toHaveValue("1,1");
  await page.goForward();
  await expect(experiment).toHaveCount(0);
  await page.goBack();
  await page
    .getByText("Practice: a different scaler and reading", { exact: true })
    .click();
  await expect(experiment).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.dataset.historyProbe),
  ).toBe("same-document");
  await page.setViewportSize({ width: 320, height: 350 });
  await experiment.getByRole("textbox").focus();
  await experiment.getByRole("textbox").scrollIntoViewIfNeeded();
  expect(
    await experiment.getByRole("textbox").evaluate((element) => {
      const box = element.getBoundingClientRect();
      return element.contains(
        document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        ),
      );
    }),
  ).toBe(true);
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
