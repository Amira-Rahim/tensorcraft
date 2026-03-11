import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("sign-in page renders with OAuth buttons", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
    await expect(page.getByText(/github/i)).toBeVisible();
    await expect(page.getByText(/google/i)).toBeVisible();
  });

  test("sign-in page has email magic link form", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test("sign-in page links to sign-up", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(
      page.getByRole("link", { name: /create an account|sign up/i }),
    ).toBeVisible();
  });

  test("sign-up page renders", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(
      page.getByText(/sign up|create.*account/i).first(),
    ).toBeVisible();
  });

  test("sign-up page links to sign-in", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("sign-in page has guest browsing link", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(
      page.getByRole("link", { name: /browse|guest|preview/i }),
    ).toBeVisible();
  });
});
