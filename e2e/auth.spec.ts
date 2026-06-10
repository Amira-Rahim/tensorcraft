import { test, expect } from "@playwright/test";

/**
 * Auth is a single merged route (/auth) with context-aware copy driven by
 * the `tc_visited` localStorage flag — there are no separate sign-in /
 * sign-up pages anymore. The legacy /auth/sign-in and /auth/sign-up routes
 * are redirect shims.
 */
test.describe("Auth Page", () => {
  test("renders with OAuth buttons", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByText(/github/i).first()).toBeVisible();
    await expect(page.getByText(/google/i).first()).toBeVisible();
  });

  test("has email magic link form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test("new visitors see the sign-up framing", async ({ page }) => {
    await page.goto("/auth");
    await page.evaluate(() => localStorage.removeItem("tc_visited"));
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /start learning/i }),
    ).toBeVisible();
  });

  test("returning visitors see the sign-in framing", async ({ page }) => {
    await page.goto("/auth");
    await page.evaluate(() => localStorage.setItem("tc_visited", "1"));
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });

  test("legacy /auth/sign-in redirects to /auth", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page).toHaveURL(/\/auth$/);
  });

  test("legacy /auth/sign-up redirects to /auth", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page).toHaveURL(/\/auth$/);
  });

  test("links to terms and privacy", async ({ page }) => {
    await page.goto("/auth");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(
      main.getByRole("link", { name: /privacy policy/i }),
    ).toBeVisible();
  });
});
