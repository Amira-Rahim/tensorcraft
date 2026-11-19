import { defineConfig } from "@playwright/test";

// Production viewer/CSS on a private Vite server. No Next or account service.
export default defineConfig({
  testDir: ".",
  testMatch: "lesson-result.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "../test-results/course-clarity-results/latest",
  use: {
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    actionTimeout: 30000,
  },
});
