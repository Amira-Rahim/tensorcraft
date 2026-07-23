import { vi } from "vitest";

/**
 * Shared `window.matchMedia` mock for `apps/web` component tests that read
 * `(prefers-color-scheme: dark)` (theme-provider.test.tsx, scheme-toggle
 * test.tsx). Supports both the modern `addEventListener`/`removeEventListener`
 * pair and the legacy `addListener`/`removeListener` pair, since
 * theme-provider.tsx registers via the modern API but jsdom/older browsers
 * only exposed the legacy one.
 *
 * This was previously copy-pasted verbatim into both files; extracted here
 * to keep them in lockstep. `packages/ui`'s own copies (particle-field.test
 * .tsx, bridge-ticker.test.tsx) are intentionally left alone — cross-package
 * test utilities aren't worth the dependency for a ~20 line mock.
 */
type MediaQueryListener = (ev: { matches: boolean }) => void;

export function mockMatchMedia(initialMatches: boolean) {
  const listeners: MediaQueryListener[] = [];
  const state = { matches: initialMatches };
  const mql = {
    get matches() {
      return state.matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_: string, cb: MediaQueryListener) => {
      listeners.push(cb);
    },
    removeEventListener: (_: string, cb: MediaQueryListener) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    addListener: (cb: MediaQueryListener) => listeners.push(cb),
    removeListener: (cb: MediaQueryListener) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => mql),
  });
  return {
    listenerCount: () => listeners.length,
    fireChange(matches: boolean) {
      state.matches = matches;
      listeners.forEach((l) => l({ matches }));
    },
  };
}
