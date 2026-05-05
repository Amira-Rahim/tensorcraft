import { test, expect } from "@playwright/test";

test.describe("Themes Page", () => {
  test("renders theme listing with Deep Orbit", async ({ page }) => {
    await page.goto("/themes");
    await expect(page.getByText(/deep orbit/i).first()).toBeVisible();
  });

  test("Deep Orbit shows Live, the other 4 show Coming soon", async ({
    page,
  }) => {
    await page.goto("/themes");
    await expect(page.getByTestId("theme-status-deep-orbit")).toContainText(
      /live/i,
    );
    for (const slug of [
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ]) {
      await expect(page.getByTestId(`theme-status-${slug}`)).toContainText(
        /coming soon/i,
      );
    }
  });

  test("coming-soon theme route renders waitlist stub, not 404", async ({
    page,
  }) => {
    const response = await page.goto("/themes/neon-protocol");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByTestId("coming-soon-stub-neon-protocol"),
    ).toBeVisible();
    await expect(
      page.getByTestId("theme-waitlist-input-neon-protocol"),
    ).toBeVisible();
  });

  test("coming-soon lesson + capstone routes 404", async ({ page }) => {
    const lesson = await page.goto(
      "/themes/neon-protocol/foundations/introduction-to-tensors",
    );
    expect(lesson?.status()).toBe(404);
    const capstone = await page.goto("/themes/neon-protocol/capstone");
    expect(capstone?.status()).toBe(404);
  });

  test("Deep Orbit links to its theme page", async ({ page }) => {
    await page.goto("/themes");
    // Theme cards link to /themes/{slug} — click on the Deep Orbit card link
    const deepOrbitLink = page
      .getByRole("link", { name: /deep orbit/i })
      .first();
    await deepOrbitLink.click();
    await expect(page).toHaveURL(/\/themes\/deep-orbit/);
  });
});

test.describe("Theme Detail Page", () => {
  test("renders Deep Orbit theme page with modules", async ({ page }) => {
    await page.goto("/themes/deep-orbit");
    await expect(page.getByText(/foundations/i).first()).toBeVisible();
  });

  test("shows module list with correct order", async ({ page }) => {
    await page.goto("/themes/deep-orbit");
    await expect(page.getByText(/foundations/i).first()).toBeVisible();
    await expect(page.getByText(/neural networks/i).first()).toBeVisible();
    await expect(page.getByText(/training loop/i).first()).toBeVisible();
  });

  test("returns 404 for unknown theme", async ({ page }) => {
    const response = await page.goto("/themes/nonexistent");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Module Overview Page", () => {
  test("renders module with lesson cards", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations");
    await expect(
      page.getByText(/introduction to tensors/i).first(),
    ).toBeVisible();
  });

  test("shows lesson difficulty and time", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations");
    await expect(page.getByText(/min/i).first()).toBeVisible();
  });

  test("lessons link to lesson viewer", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations");
    await page
      .getByText(/introduction to tensors/i)
      .first()
      .click();
    await expect(page).toHaveURL(
      /\/themes\/deep-orbit\/foundations\/introduction-to-tensors/,
    );
  });
});

test.describe("Lesson Viewer Page", () => {
  test("renders lesson content with title", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    await expect(
      page.getByText(/introduction to tensors/i).first(),
    ).toBeVisible();
  });

  test("shows progress bar", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    const progressBar = page.getByRole("progressbar");
    await expect(progressBar).toBeVisible();
  });

  test("shows Continue button", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeVisible();
  });

  test("shows Back or Module link", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    // First step shows a link back to the module; later steps show "← Back"
    const backLink = page
      .getByRole("link", { name: /back|module|foundations/i })
      .first();
    await expect(backLink).toBeVisible();
  });

  test("returns 404 for unknown lesson", async ({ page }) => {
    const response = await page.goto(
      "/themes/deep-orbit/foundations/nonexistent-lesson",
    );
    expect(response?.status()).toBe(404);
  });
});
