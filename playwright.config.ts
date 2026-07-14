import { defineConfig, devices } from "@playwright/test";

// Default to the standard Next dev port (3000); allow PW_PORT to override so
// runs can avoid a port already taken by an unrelated local service.
const PORT = process.env.PW_PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  // The local webServer is `next dev`, which compiles routes on demand; a
  // cold first hit on the lesson route measured 14.96s on 2026-07-14, so
  // the old 15s ceiling made fresh-server runs a coin flip. 30s only slows
  // genuinely failing assertions, and only locally.
  expect: { timeout: 30000 },
  use: {
    baseURL: BASE_URL,
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
    command: `pnpm --filter @tensorcraft/web dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
