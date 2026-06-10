// Setup file for @tensorcraft/api vitest runs.
//
// The shared root `vitest.config.ts` declares `setupFiles: ["./vitest.setup.ts"]`
// which vitest resolves relative to the current working directory. When the API
// package runs its tests via `pnpm --filter @tensorcraft/api test`, vitest
// therefore looks for `apps/api/vitest.setup.ts`. API (Hono) tests don't need
// jest-dom or axe matchers, so this file is intentionally a no-op, its sole
// purpose is to satisfy the setupFiles lookup when the CWD is apps/api.
export {};
