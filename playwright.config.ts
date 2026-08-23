import { defineConfig, devices } from "@playwright/test";

// Default to the standard Next dev port (3000); allow PW_PORT to override so
// runs can avoid a port already taken by an unrelated local service.
const PORT = process.env.PW_PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry, not 2: the dev-server compile races the extra retry buffered
  // are gone now that CI runs against `next start` (see webServer below),
  // and each retry of a REAL failure costs a full serial re-run through the
  // long expect timeouts (the 2026-08-23 axe failure ran 3x per scheme).
  retries: process.env.CI ? 1 : 0,
  // 2 workers in CI. The old `workers: 1` existed to keep parallel specs
  // from stampeding `next dev`'s on-demand compiler; a prod server has no
  // compile step to stampede. The runner has 2 vCPUs, so 2 overlaps one
  // browser with server work without oversubscribing.
  workers: process.env.CI ? 2 : undefined,
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
    // existing suite - including the canonical axe contrast gate - to an
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
  // CI serves the production build: the e2e job in ci.yml runs
  // `turbo build --filter @tensorcraft/web` with the placeholder Supabase
  // env first (NEXT_PUBLIC_* inline at build time), then `next start`
  // serves precompiled pages. That is what retired the dev-server compile
  // problem this block used to document: `next dev` compiled routes on
  // demand (19-154s cold), which forced workers: 1, a 180s boot ceiling,
  // and at the old 30s ceiling silently skipped 10 of 14 a11y specs - a
  // gate whose absence was indistinguishable from its success. Local runs
  // keep `next dev` so `pnpm test:e2e` needs no build step; the 180s local
  // ceiling stays for cold dev compiles, and it only costs time on a
  // genuinely stuck server.
  webServer: {
    command: process.env.CI
      ? `pnpm --filter @tensorcraft/web start -p ${PORT}`
      : `pnpm --filter @tensorcraft/web dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60_000 : 180_000,
  },
});
