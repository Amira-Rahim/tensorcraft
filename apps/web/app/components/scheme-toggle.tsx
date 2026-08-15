"use client";

import { useState } from "react";
import type { SchemePreference } from "@tensorcraft/shared";
import { useWorld } from "./world-provider";

// Brutalist icon button: monospace glyphs, no rounded pill switch.
// System (follow OS) -> Light -> Dark -> System. `schemePreference` is the
// stored value (null | "light" | "dark"); the resolved `scheme` is not used
// here on purpose - the toggle reflects the user's PREFERENCE, not the
// OS-resolved color, so a "system" user on a dark OS still sees the system
// glyph, not the dark one.
type SchemeState = "system" | "light" | "dark";

const STATE_ORDER: SchemeState[] = ["system", "light", "dark"];

const GLYPH: Record<SchemeState, string> = {
  system: "◐", // ◐ half-filled circle
  light: "○", // ○ open circle
  dark: "●", // ● filled circle
};

function stateFromPreference(pref: SchemePreference): SchemeState {
  return pref === null ? "system" : pref;
}

function preferenceFromState(state: SchemeState): SchemePreference {
  return state === "system" ? null : state;
}

function nextState(state: SchemeState): SchemeState {
  const idx = STATE_ORDER.indexOf(state);
  return STATE_ORDER[(idx + 1) % STATE_ORDER.length];
}

export function SchemeToggle() {
  const { schemePreference, setScheme } = useWorld();
  // Screen-reader backstop (post-launch review, 2026-07-22): the accessible
  // name doubles as the current state AND changes in place on activation, on
  // the element that stays focused. Some AT/browser combos don't reliably
  // re-announce a name change on the currently-focused control - they watch
  // for content/live-region changes, not name recomputation. This status
  // span is always mounted (required for live-region announcements to fire
  // at all) but starts empty so mount/navigation stays silent; it only gets
  // text after the user actually activates the toggle. Same pattern as
  // recall-prompt.tsx's "Answer revealed." region.
  const [announcement, setAnnouncement] = useState("");
  const state = stateFromPreference(schemePreference);
  const upcoming = nextState(state);
  const label = `Color scheme: ${state} (activate for ${upcoming})`;

  function handleClick() {
    setScheme(preferenceFromState(upcoming));
    setAnnouncement(`Color scheme: ${upcoming}.`);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        // `title` deliberately duplicates `aria-label` rather than adding a
        // distinct aria-describedby: this is a mouse-hover tooltip for
        // sighted users, not a second accessible description, so repeating
        // the same string is intentional (tooltip parity), not redundancy
        // to clean up.
        title={label}
        className="flex items-center justify-center w-11 h-11 border border-border bg-surface font-mono text-base leading-none text-text-primary rounded-none transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        {/*
         * Hydration note: the server snapshot for `schemePreference` is
         * always `null` ("system"); a client with a *stored* override (e.g.
         * "dark") only learns that from localStorage after mount.
         * useSyncExternalStore renders the server value during the
         * hydration pass itself (so there is no server/client DOM mismatch
         * for React to warn about), then corrects to the real client value
         * in an ordinary post-mount render. That correction can still flip
         * this glyph a beat after first paint, so it's marked
         * suppressHydrationWarning defensively - same convention as the
         * <html> tag in layout.tsx, which has a genuine mismatch (the FOUC
         * script edits the DOM before React hydrates). A "mounted"
         * placeholder pass was the other option per the plan, but it would
         * mean the button briefly renders with no meaningful state (or a
         * generic placeholder label), which is worse for a11y than
         * settling to the correct label a beat after mount.
         */}
        <span aria-hidden="true" suppressHydrationWarning>
          {GLYPH[state]}
        </span>
      </button>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </>
  );
}
