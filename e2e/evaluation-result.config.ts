import { defineConfig } from "@playwright/test";

// This spec starts its own loopback Vite fixture. It needs no Next server,
// account service, or paid lesson route.
export default defineConfig({
  testDir: ".",
  testMatch: "evaluation-result.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "../test-results/evaluation-result-browser",
  use: {
    browserName: "chromium",
    headless: true,
    actionTimeout: 30000,
  },
});
