import { test, expect } from "@playwright/test";

test.describe("Operator log (unauth)", () => {
  test("/log redirects unauthenticated users to /auth", async ({ page }) => {
    await page.goto("/log");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("/auth redirect preserves redirectTo=/log", async ({ page }) => {
    const response = await page.goto("/log");
    // After Next redirects, the URL should include redirectTo somewhere.
    expect(response?.url()).toMatch(/redirectTo/);
  });
});
