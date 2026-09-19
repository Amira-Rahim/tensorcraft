import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`unfinished code, solution recovery and save failure at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
    });
    const url =
      "/worlds/deep-orbit/foundations/introduction-to-tensors?start=challenge";
    await page.goto(url);
    async function openEditor() {
      if (width < 1024)
        await page.getByRole("button", { name: "Editor", exact: true }).click();
      await expect(page.locator(".cm-content").first()).toBeVisible();
    }
    async function writeCode(code: string) {
      await page.locator(".cm-content").first().click();
      await page.keyboard.press(
        process.platform === "darwin" ? "Meta+a" : "Control+a",
      );
      await page.keyboard.insertText(code);
    }
    await openEditor();
    const ownCode = "const unfinishedPacket = [2, 5, 8]; // no test run yet";
    await writeCode(ownCode);
    // Leave immediately, before the debounce: unmount must flush the draft.
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Step 4: Challenge", exact: true })
      .click();
    await openEditor();
    await expect(page.locator(".cm-content").first()).toContainText(ownCode);
    await page.reload();
    await openEditor();
    await expect(page.locator(".cm-content").first()).toContainText(ownCode);
    await page
      .getByRole("button", { name: "Show Solution", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Restore My Code", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("tc-code-create-a-tensor")!)
              .solutionViewed,
        ),
      )
      .toBe(true);
    await page.reload();
    await openEditor();
    await page
      .getByRole("button", { name: "Restore My Code", exact: true })
      .click();
    await expect(page.locator(".cm-content").first()).toContainText(ownCode);
    await expect(
      page.getByText(
        "Solution revealed. Try changing it and re-running the tests.",
      ),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("tc-code-create-a-tensor")!).code,
        ),
      )
      .toBe(ownCode);
    // Simulate a release while the editor is unmounted; its pagehide flush
    // correctly retains the old starter while the old page is open.
    await page.goto("/learn");
    await page.evaluate(() => {
      const key = "tc-code-create-a-tensor";
      const draft = JSON.parse(localStorage.getItem(key)!);
      localStorage.setItem(
        key,
        JSON.stringify({ ...draft, starter: "old starter" }),
      );
    });
    await page.goto(url);
    await openEditor();
    await expect(
      page.getByText(/The starter has changed since this draft/),
    ).toBeVisible();
    await expect(page.locator(".cm-content").first()).toContainText(ownCode);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith("tc-code-"))
          throw new DOMException(
            "Injected quota failure",
            "QuotaExceededError",
          );
        return original.call(this, key, value);
      };
    });
    await writeCode(ownCode + "\n// quota probe");
    await expect(page.getByText(/Draft could not be saved/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 6: Consequence", exact: true }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}

test("an unreadable draft stays intact until an explicit reset", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (window.top !== window || sessionStorage.getItem("draft-fixture"))
      return;
    sessionStorage.setItem("draft-fixture", "1");
    localStorage.setItem("tc-cookie-consent", "declined");
    localStorage.setItem("tc-script-skip", "1");
    localStorage.setItem(
      "tc-code-create-a-tensor",
      JSON.stringify({ version: 2, code: "future draft" }),
    );
  });
  await page.goto(
    "/worlds/deep-orbit/foundations/introduction-to-tensors?start=challenge",
  );
  await expect(page.getByText(/The previous draft is preserved/)).toBeVisible();
  const editor = page.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.insertText("// temporary work\n");
  await page
    .getByRole("button", { name: "Step 2: Concept", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("tc-code-create-a-tensor")!).code,
    ),
  ).toBe("future draft");
  await page
    .getByRole("button", { name: "Step 4: Challenge", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText(/The previous draft is preserved/)).toHaveCount(
    0,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tc-code-create-a-tensor")!)?.version,
      ),
    )
    .toBe(1);
});
