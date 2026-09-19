import { test, expect } from "@playwright/test";

const lesson = "/worlds/deep-orbit/foundations/introduction-to-tensors";

for (const colorScheme of ["dark", "light"] as const) {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    test(`mobile sign-in survives resize: ${colorScheme}, ${reducedMotion}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.emulateMedia({ colorScheme, reducedMotion });
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto("/auth");
      await expect(page.locator("#auth-email")).toBeVisible();
      await page.setViewportSize({ width: 1100, height: 800 });
      await expect(page.getByTestId("auth-left-pane")).toBeVisible();
      await page.setViewportSize({ width: 390, height: 700 });
      await expect(page.locator("#auth-email")).toBeVisible();
      await page.locator("#auth-email").fill("learner@example.test");
      expect(errors).toEqual([]);
    });
  }
}

for (const width of [320, 375, 390]) {
  test(`consent and support are usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Essential only", exact: true })
      .click();
    const trigger = page.getByRole("button", {
      name: "Report Issue",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Report an issue" });
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.x + box.width).toBeLessThanOrEqual(width - 15);
    expect(box.y).toBeGreaterThanOrEqual(15);
    expect(box.y + box.height).toBeLessThanOrEqual(585);
    await expect(
      dialog.getByRole("button", { name: "Close", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test("mobile glossary opens beside the term and returns focus on Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "1");
    localStorage.setItem("tc_step_max_deep-orbit_introduction-to-tensors", "5");
  });
  await page.goto(lesson);
  const term = page.locator("button[data-glossary-term]:visible").first();
  await term.click();
  const definition = page.getByRole("note");
  await expect(definition).toBeVisible();
  const box = (await definition.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(16);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
  const termBox = (await term.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(termBox.y + termBox.height);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.keyboard.press("Escape");
  await expect(definition).not.toBeVisible();
  await expect(term).toBeFocused();
});

test("mobile editor preserves typed work across views and desktop resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc_step_deep-orbit_introduction-to-tensors", "3");
    localStorage.setItem("tc_step_max_deep-orbit_introduction-to-tensors", "5");
  });
  await page.goto(lesson);
  await page.getByRole("button", { name: "Editor", exact: true }).click();
  const editor = page.locator(".cm-content");
  await expect(editor).toHaveCount(1);
  await expect(editor).toBeVisible();
  expect(
    await page
      .locator(".cm-lineNumbers")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(12);
  await editor.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+a" : "Control+a",
  );
  await page.keyboard.insertText(
    "// work kept when changing views\nconst reading = tf.tensor([1, 2]);",
  );
  await page.getByRole("button", { name: "Run Tests", exact: true }).click();
  const results = page.getByTestId("test-results-panel");
  await expect(results).toBeVisible({ timeout: 60000 });
  await expect(results).not.toContainText("All tests passed!");
  const savedResults = await results.innerText();
  await page.getByRole("button", { name: "Instructions", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole("button", { name: "Editor", exact: true }).click();
  await expect(editor).toContainText("work kept when changing views");
  await expect(results).toHaveText(savedResults, { useInnerText: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(editor).toHaveCount(1);
  await expect(editor).toContainText("work kept when changing views");
  const task = (await page.getByTestId("lesson-right").boundingBox())!;
  const gate = (await page
    .getByRole("button", { name: /Pass .*exercise.*to continue/ })
    .boundingBox())!;
  expect(gate.y).toBeGreaterThanOrEqual(task.y + task.height);
});
