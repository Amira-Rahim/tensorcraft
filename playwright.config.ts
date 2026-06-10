import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  // The local webServer is `next dev`, which compiles routes on demand;
  // under full-suite parallel load a first hit on a heavy lesson route can
  // exceed the 5s default expect timeout and flake unrelated tests.
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    // Mobile device emulation per dev-plan §6b. Runs a scoped mobile smoke
    // suite (see `e2e/mobile.spec.ts`) against the 3 reference devices.
    {
      name: "mobile-iphone-se",
      use: { ...devices["iPhone SE"] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: "mobile-pixel-7",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: "tablet-ipad",
      use: { ...devices["iPad (gen 7)"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "pnpm --filter @tensorcraft/web dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
