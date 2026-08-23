/**
 * Whether the learner has already skipped an opening scene.
 *
 * The first lesson opens with a roughly 15.5 second auto-playing scene, and
 * for a long time the only escape was a 10px "Skip" control. Owner decision
 * 2026-08-23: keep the scene, make Skip a real control, and stop replaying it
 * at someone who already said no once.
 *
 * Deliberately not a server preference: it needs to work for guests reading
 * the free module, who have no account to store it against.
 *
 * Every access is wrapped. `localStorage` does not return null when site data
 * is blocked, it THROWS SecurityError (Safari "Block All Cookies", enterprise
 * policy, any sandboxed iframe). An unguarded read of exactly this API inside
 * a provider once unwound to `global-error.tsx` and white-screened every
 * route, so the rule here is that storage may fail and the page must not.
 */
export const SCRIPT_SKIP_STORAGE_KEY = "tc-script-skip";

/** True only when the learner has previously skipped a scene. */
export function prefersSkippedScript(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SCRIPT_SKIP_STORAGE_KEY) === "1";
  } catch {
    // Site data blocked. Not a preference, so play the scene as normal.
    return false;
  }
}

/** Record that the learner skipped. Never throws: the skip must still work. */
export function rememberScriptSkipped(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCRIPT_SKIP_STORAGE_KEY, "1");
  } catch {
    // Storage blocked. The skip still applies to this playback, it just will
    // not be remembered for the next lesson.
  }
}
