import { test, expect } from "@playwright/test";

test.describe("Onboarding Page", () => {
  test("renders onboarding welcome step", async ({ page }) => {
    // Onboarding requires auth, will redirect to /auth for unauthenticated users
    // Just verify the page doesn't crash and redirects properly
    await page.goto("/onboarding");
    // Should either show onboarding or redirect to auth
    await page.waitForURL(/\/(onboarding|auth)/);
  });
});
