import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, scheme] of [
  [1440, "dark"],
  [390, "dark"],
  [320, "light"],
] as const) {
  test(`one packet from visual to practice at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() =>
      localStorage.setItem("tc-cookie-consent", "declined"),
    );
    await page.goto(
      "/worlds/deep-orbit/foundations/introduction-to-tensors?start=concept",
    );
    const instrument = page.locator(".lesson-instrument");
    await expect(instrument).toContainText("five-reading excerpt");
    const slider = instrument.getByRole("slider", {
      name: "Inspect a reading",
    });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(
      instrument.locator('.iv-readout [role="status"]'),
    ).toContainText("Index 4 holds 0.47");
    await expect(
      page.getByText("inspect-a-packet.ts", { exact: true }),
    ).toBeVisible();
    const reference = page.locator("details").filter({
      has: page.getByText(
        "Reference: tensor ranks, backend storage, and cleanup",
        { exact: true },
      ),
    });
    await expect(reference).not.toHaveAttribute("open");
    const goals = page.locator(".lesson-goals");
    await expect(goals).not.toHaveAttribute("open");
    expect(
      (await new AxeBuilder({ page }).include(".lesson-concept").analyze())
        .violations,
    ).toEqual([]);
    await page.evaluate(async () => {
      await document.fonts.ready;
      (document.activeElement as HTMLElement)?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: testInfo.outputPath(`concept-${width}-${scheme}.png`),
      fullPage: true,
    });
    await testInfo.attach("page-size.json", {
      body: JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          height: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        })),
      ),
      contentType: "application/json",
    });
    await reference.locator("summary").click();
    await expect(
      page.getByText("tensor-memory.ts", { exact: true }),
    ).toBeVisible();
    await goals.locator("summary").click();
    await expect(page.getByTestId("concept-intro")).toBeVisible();
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(page.getByTestId("exercise-brief")).toContainText(
      "five readings",
    );
    await expect(page.getByTestId("mission-handoff")).toContainText(
      "same five values",
    );
    await expect(page.getByTestId("challenge-passed-banner")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Step 5: Epilogue", exact: true }),
    ).toBeDisabled();
  });
}
