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
    // Playwright defaults to light OS emulation. The light-mode rollout's
    // FOUC script (apps/web/app/layout.tsx) now reads that and renders the
    // whole app in the light scheme, which would silently flip this entire
    // existing suite — including the canonical axe contrast gate — to an
    // untested scheme. Pinning dark here preserves the historical meaning
    // of this suite; Task 14 (docs/superpowers/plans/2026-07-22-light-mode.md)
    // introduces the deliberate two-scheme matrix and removes/loops this pin.
    colorScheme: "dark",
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
    // 30s was not enough and the failure mode was dangerous. `next dev`
    // compiles on demand; measured cold compiles here run 19-154s (the
    // comment above already records a 14.96s cold lesson hit). When this
    // timeout fires, the whole run aborts before a single spec executes —
    // and that reads as infra flake, not as "accessibility was never
    // checked". The a11y suite in particular was passing only 4 of 14 specs
    // for that reason, with the ten covering Themes, Theme Detail, Pricing
    // and every lesson step — the entire paid surface — simply never run.
    //
    // A gate whose absence is indistinguishable from its success is worse
    // than no gate: it manufactures confidence. Raise the ceiling so the
    // suite actually runs; it only costs time on a genuinely stuck server.
    timeout: 180_000,
  },
});
