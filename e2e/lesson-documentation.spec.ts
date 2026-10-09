import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, scheme] of [
  [1440, "dark"],
  [320, "light"],
] as const) {
  test(`lesson documentation stays optional and keyboard accessible at ${width}px`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    const instrument = page.locator(".lesson-instrument");
    await instrument.getByRole("button", { name: "Create tensor" }).click();
    await expect(instrument.getByRole("status")).toContainText(
      "All 5 readings match",
    );
    const tensor = instrument.getByRole("link", { name: /^tf.tensor,/ });
    await expect(tensor).toHaveAttribute(
      "href",
      "https://js.tensorflow.org/api/4.22.0/#tensor",
    );
    // Check the navigation without making the UI test depend on an external site.
    await context.route("https://js.tensorflow.org/api/**", (route) =>
      route.fulfill({ body: "TensorFlow.js reference" }),
    );
    const popupPromise = page.waitForEvent("popup");
    await tensor.focus();
    await page.keyboard.press("Enter");
    const docs = await popupPromise;
    await expect(docs).toHaveURL(
      "https://js.tensorflow.org/api/4.22.0/#tensor",
    );
    await docs.close();
    await expect(instrument.getByRole("status")).toContainText(
      "All 5 readings match",
    );
    await expect(page).toHaveURL(/#step-concept$/);

    const shape = page.getByRole("button", { name: "shape", exact: true });
    await shape.focus();
    await page.keyboard.press("Enter");
    const note = page.getByRole("note", { name: "shape definition" });
    await expect(
      note.getByRole("button", { name: "Close definition" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(note.getByRole("link")).toBeFocused();
    await expect(note.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.tensorflow.org/js/guide/tensors_operations",
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include(".lesson-concept")
          .include('[role="note"]')
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`documentation-${width}.png`),
      fullPage: true,
    });
    await note.screenshot({
      path: testInfo.outputPath(`term-reference-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(shape).toBeFocused();
    await expect(note).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
