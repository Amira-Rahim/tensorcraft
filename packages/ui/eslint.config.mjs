// Re-export the shared flat config; eslint 9 requires a per-package
// eslint.config file, and before this existed every "lint pass" here was
// a stale turbo cache replay (2026-07-12 round-4 audit find).
export { default } from "@tensorcraft/config/eslint/base";
