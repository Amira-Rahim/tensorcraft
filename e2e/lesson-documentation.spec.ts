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
    // The server HTML already shows Continue, but a click before hydration
    // does nothing (flaky on Linux CI, 2026-10-25). The Briefing marks the
    // client mount by resolving its scene.
    await expect(page.locator("[data-script-state='done']")).toBeAttached();
    // The lesson nav button reads "Continue" with no arrow since 2026-10-19.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const instrument = page.locator(".lesson-instrument");
    // Since 2026-10-19 the Concept example runs as "Run example" and reports
    // the tensor's shape above a chart drawn from it.
    await instrument
      .getByRole("button", { name: "Run example", exact: true })
      .click();
    const result = instrument.getByText(
      "The example’s tensor has shape [12]: one axis holding 12 values.",
    );
    await expect(instrument.getByRole("status")).toHaveText(
      "From your latest run",
    );
    await expect(result).toBeVisible();
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
    // The run result survives the trip to the documentation.
    await expect(instrument.getByRole("status")).toHaveText(
      "From your latest run",
    );
    await expect(result).toBeVisible();
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
