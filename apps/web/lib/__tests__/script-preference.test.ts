import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  SCRIPT_SKIP_STORAGE_KEY,
  prefersSkippedScript,
  rememberScriptSkipped,
} from "../script-preference";

/**
 * Remembering that a learner skipped the opening scene.
 *
 * The first lesson opens with a roughly 15.5s auto-playing scene, and the
 * only way out was a 10px "Skip" control. Owner decision 2026-08-23: keep
 * the scene, fix the affordance, and stop asking someone who already said no.
 *
 * Every access is guarded. `localStorage` does not return null when site data
 * is blocked, it THROWS SecurityError (Safari "Block All Cookies", enterprise
 * policy, sandboxed iframes), and an unguarded read inside a provider once
 * took the whole site to a white screen.
 */
describe("script playback preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not claim a preference before the learner has expressed one", () => {
    expect(prefersSkippedScript()).toBe(false);
  });

  it("remembers a skip", () => {
    rememberScriptSkipped();

    expect(prefersSkippedScript()).toBe(true);
    expect(window.localStorage.getItem(SCRIPT_SKIP_STORAGE_KEY)).toBe("1");
  });

  it("treats a blocked read as no preference rather than throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
      setItem: () => {},
      clear: () => {},
    });

    expect(() => prefersSkippedScript()).not.toThrow();
    expect(prefersSkippedScript()).toBe(false);
  });

  it("swallows a blocked write so the skip still works", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
      clear: () => {},
    });

    expect(() => rememberScriptSkipped()).not.toThrow();
  });

  it("reports no preference when there is no window at all", () => {
    vi.stubGlobal("window", undefined);

    expect(prefersSkippedScript()).toBe(false);
  });
});
