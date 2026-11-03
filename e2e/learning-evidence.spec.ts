import { test, expect } from "@playwright/test";

test.use({ actionTimeout: 30_000 });

for (const width of [1440, 390]) {
  test(`normalization saves actual runs and recovers newer code at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
    });
    await page.goto(
      "/worlds/deep-orbit/foundations/normalization?start=challenge",
    );
    const editor = page.locator(".cm-content").first();
    await expect(editor).toBeVisible();
    const history = page.getByRole("region", {
      name: "Saved normalization runs",
    });
    await expect(history).toContainText(
      "No saved normalization runs here yet.",
    );
    await page
      .getByRole("button", { name: "Show Solution", exact: true })
      .click();
    await page.getByRole("button", { name: "Run Tests", exact: true }).click();
    await expect(page.getByTestId("test-results-panel")).toContainText(
      "All tests passed!",
      { timeout: 60_000 },
    );
    await history
      .getByRole("button", { name: "Save this run", exact: true })
      .click();
    await expect(
      history.getByRole("button", { name: "Run saved", exact: true }),
    ).toBeVisible();
    await history.locator("summary").filter({ hasText: "Saved run:" }).click();
    await expect(history).toContainText("Solution viewed before this run.");
    await history.getByText("All captured tables", { exact: true }).click();
    await expect(
      history.getByRole("heading", { name: "Input readings", exact: true }),
    ).toBeVisible();
    await expect(
      history.getByRole("heading", {
        name: "Saved training statistics",
        exact: true,
      }),
    ).toBeVisible();
    await history
      .getByRole("combobox", { name: "Reading", exact: true })
      .selectOption("2");
    await history
      .getByRole("combobox", { name: "Feature", exact: true })
      .selectOption("1");
    await expect(history).toContainText("0.4");
    expect(
      await history
        .locator("th, td")
        .evaluateAll((cells) =>
          cells.every((cell) => cell.scrollWidth <= cell.clientWidth + 1),
        ),
    ).toBe(true);
    await history.screenshot({
      path: testInfo.outputPath(`saved-normalization-${width}.png`),
    });

    // Release the solution's recovery slot, then keep a new draft while inspecting.
    await page
      .getByRole("button", { name: "Restore My Code", exact: true })
      .click();
    const newerCode = "throw new Error('My newer draft');";
    await editor.click();
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+a" : "Control+a",
    );
    await page.keyboard.insertText(newerCode);
    await page.getByRole("button", { name: "Run Tests", exact: true }).click();
    await expect(page.getByTestId("test-results-panel")).toContainText(
      "My newer draft",
    );
    await expect(history).toContainText(
      "Your current editor contains different code.",
    );
    await history
      .getByRole("button", { name: "Save this run", exact: true })
      .click();
    await expect(
      history.locator("summary").filter({ hasText: "First saved run:" }),
    ).toBeVisible();
    await expect(
      history.locator("summary").filter({ hasText: "Latest saved run:" }),
    ).toBeVisible();
    await expect(editor).toContainText(newerCode);
    await history
      .getByRole("button", { name: "Restore saved code", exact: true })
      .first()
      .click();
    await expect(editor).not.toContainText(newerCode);
    await page.reload();
    await expect(editor).toBeVisible();
    await page
      .getByRole("button", { name: "Restore My Code", exact: true })
      .click();
    await expect(editor).toContainText(newerCode);
    await expect(
      history.locator("summary").filter({ hasText: "First saved run:" }),
    ).toBeVisible();
    await expect(
      history.locator("summary").filter({ hasText: "Latest saved run:" }),
    ).toBeVisible();
    await history
      .locator("summary")
      .filter({ hasText: "First saved run:" })
      .click();
    await history
      .getByText("All captured tables", { exact: true })
      .first()
      .click();
    await expect(
      history.getByRole("heading", {
        name: "Saved training statistics",
        exact: true,
      }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });
}
