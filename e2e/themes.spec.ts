import { test, expect } from "@playwright/test";

test.describe("Themes Page", () => {
  test("renders theme listing with Deep Orbit", async ({ page }) => {
    await page.goto("/themes");
    await expect(page.getByText(/deep orbit/i).first()).toBeVisible();
  });

  test("shows coming soon badges for locked themes", async ({ page }) => {
    await page.goto("/themes");
    const comingSoon = page.getByText(/coming soon/i);
    await expect(comingSoon.first()).toBeVisible();
  });

  test("Deep Orbit links to its theme page", async ({ page }) => {
    await page.goto("/themes");
    await page.getByRole("link", { name: /start learning/i }).click();
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

  test("shows lesson narrative dialogue", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    // Lesson should render dialogue from MDX
    const blockquote = page.locator("blockquote");
    await expect(blockquote.first()).toBeVisible();
  });

  test("shows sidebar navigation with lesson list", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
    // Should see other lessons in the sidebar
    await expect(page.getByText(/tensor shapes/i).first()).toBeVisible();
  });

  test("has prev/next navigation", async ({ page }) => {
    await page.goto("/themes/deep-orbit/foundations/tensor-shapes");
    // Second lesson: prev shows "← Introduction to Tensors", next shows "Next: ..."
    await expect(page.getByText(/← Introduction to Tensors/i)).toBeVisible();
    await expect(page.getByText(/Next:/i).first()).toBeVisible();
  });

  test("returns 404 for unknown lesson", async ({ page }) => {
    const response = await page.goto(
      "/themes/deep-orbit/foundations/nonexistent-lesson",
    );
    expect(response?.status()).toBe(404);
  });
});
