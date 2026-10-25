import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [1440, 1024, 390, 320])
  for (const colorScheme of ["dark", "light"] as const) {
    test(`Neon preview is usable without a purchase: ${width}px ${colorScheme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme });
      await page.addInitScript(() =>
        localStorage.setItem("tc-cookie-consent", "declined"),
      );
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/worlds/neon-protocol#vision-preview");
      const sample = page.getByTestId("vision-preview");
      await expect(sample).toBeVisible();
      // The label lost its decorative dot separator in the 2026-10-19
      // construction audit (content fix 12, 07a41013). It still says the
      // sample is free and the full course is not out yet.
      await expect(sample).toContainText(
        "Free vision sample, full course coming later",
      );
      await sample.getByRole("textbox").fill("2.8");
      await sample.getByRole("button", { name: "Check this window" }).focus();
      await page.keyboard.press("Enter");
      await expect(sample.getByRole("status")).toContainText("Matched");
      await sample.getByLabel("Add 0.1 brightness to every pixel").check();
      await sample.getByRole("textbox").fill("2.8");
      await sample.getByRole("button", { name: "Check this window" }).click();
      await expect(sample.getByRole("status")).toContainText("Matched");
      await sample
        .getByRole("combobox", { name: "Image pattern", exact: true })
        .selectOption("reversed");
      await sample.getByRole("textbox").fill("2.8");
      await sample.getByRole("button", { name: "Check this window" }).click();
      await expect(sample.getByRole("status")).toContainText("is -2.8");
      await sample
        .getByText("The JavaScript and TensorFlow.js connection", {
          exact: true,
        })
        .click();
      await sample
        .getByText("Returning from Deep Orbit, or already know the basics?", {
          exact: true,
        })
        .click();
      await expect(
        sample.getByRole("link", { name: "Weighted sums" }),
      ).toHaveAttribute("href", /tensor-operations/);
      expect(
        (
          await new AxeBuilder({ page })
            .include('[data-testid="vision-preview"]')
            .analyze()
        ).violations,
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      if (width === 320) {
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "200%"),
        );
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        await sample
          .getByRole("region", { name: "Vision sample code" })
          .focus();
        await page.keyboard.press("ArrowRight");
        await page.evaluate(
          () => (document.documentElement.style.fontSize = ""),
        );
      }
      await sample.screenshot({
        path: testInfo.outputPath(`vision-${width}-${colorScheme}.png`),
      });
      expect(errors).toEqual([]);
    });
  }
