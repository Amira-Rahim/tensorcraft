// Ambient type augmentation for Vitest test matchers.
// Brings in @testing-library/jest-dom custom matchers (toBeInTheDocument,
// toHaveAttribute, toHaveClass, etc.) AND vitest-axe matchers
// (toHaveNoViolations) so all .test.ts(x) files under apps/web see them
// without needing per-file imports. Runtime registration happens in the
// root vitest.setup.ts; this file only informs the TypeScript compiler.

import "@testing-library/jest-dom/vitest";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<unknown, T> {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<
    unknown,
    unknown
  > {
    toHaveNoViolations(): void;
  }
}
