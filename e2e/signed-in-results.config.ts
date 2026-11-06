import { defineConfig } from "@playwright/test";

// Start the isolated review stack separately with review:prepare/review:dev.
// Auth links and session cookies must never enter recorded traces or videos.
export default defineConfig({
  testDir: ".",
  testMatch: "signed-in*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  expect: { timeout: 30_000 },
  reporter: "list",
  outputDir: "../test-results/signed-in-results",
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    headless: true,
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
    colorScheme: "dark",
    reducedMotion: "reduce",
    trace: "off",
    video: "off",
    screenshot: "off",
  },
});
