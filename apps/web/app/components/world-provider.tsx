"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_WORLD,
  isLaunched,
  isColorScheme,
  SCHEME_STORAGE_KEY,
} from "@tensorcraft/shared";
import type {
  WorldSlug,
  ColorScheme,
  SchemePreference,
} from "@tensorcraft/shared";

const STORAGE_KEY = "tc-active-world";

function isValidWorld(value: string): value is WorldSlug {
  // V1 scope-revert (2026-05-05): only launched worlds are settable as the
  // active world. Coming-soon slugs are stripped at the boundary so a stale
  // localStorage value or hand-edited DOM attribute can't shift the palette.
  return isLaunched(value);
}

function getStoredWorld(): WorldSlug {
  if (typeof window === "undefined") return DEFAULT_WORLD;
  // The try/catch is load-bearing, not defensive habit. `localStorage` does
  // not merely return null when site data is blocked — accessing it THROWS
  // SecurityError (Safari "Block All Cookies", Chrome site-data blocking,
  // enterprise policy, any sandboxed iframe).
  //
  // This function is the `getSnapshot` of a useSyncExternalStore in a
  // provider that wraps the entire app, so it runs DURING RENDER. An
  // unguarded throw here unwound all the way to global-error.tsx — a white
  // screen on every route, including /terms and /privacy, for every user in
  // that configuration. Falling back to the default world is completely
  // recoverable; crashing is not.
  //
  // The inline bootstrap at layout.tsx:111 already wraps this same API in
  // try/catch, as do ~25 other storage sites in the app. This one was missed.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && isValidWorld(stored) ? stored : DEFAULT_WORLD;
  } catch {
    return DEFAULT_WORLD;
  }
}

function applyWorld(slug: WorldSlug) {
  document.documentElement.dataset.world = slug;
  // Same hazard on the write side: the world still applies to the DOM, it
  // just will not persist across navigations for these users.
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // Site data blocked; the dataset assignment above still took effect.
  }
}

// External store for world state, lets useSyncExternalStore track changes
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): WorldSlug {
  return getStoredWorld();
}

function getServerSnapshot(): WorldSlug {
  return DEFAULT_WORLD;
}

// ---------------------------------------------------------------------------
// Color scheme (light/dark), orthogonal to the narrative world above. One
// provider, two stores — the scheme axis gets its own listener array so a
// scheme change doesn't force world subscribers to re-render and vice versa.
//
// `SchemePreference` is what's stored: an explicit "light"/"dark" choice, or
// `null` meaning "follow the OS". Only explicit choices persist; `null` is
// never written to localStorage, it's the absence of the key.
//
// Same SecurityError hazard as `getStoredWorld` above applies here: this
// runs inside a useSyncExternalStore getSnapshot, i.e. during render. Every
// localStorage touch is try/catch'd for the same reason — a blocked-storage
// browser must still render (just without persistence), not white-screen.
//
// `inMemorySchemeFallback` covers a narrower bug than the try/catch alone:
// with storage blocked, `setScheme("light")` would still write the DOM
// attribute, but the NEXT snapshot read (`getStoredScheme` inside the same
// render pass, or on the next re-render) would hit the catch branch again,
// see nothing to read, and silently fall back to `null` (no override) —
// React's state would then permanently disagree with the DOM the user is
// actually looking at. `persistSchemePref` records the last explicit choice
// here too, and `getStoredScheme` reads it back ONLY in the catch branch:
// normal (non-blocked) browsers never touch this variable, real storage
// stays the single source of truth for them.
let inMemorySchemeFallback: SchemePreference = null;

function getStoredScheme(): SchemePreference {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(SCHEME_STORAGE_KEY);
    return v && isColorScheme(v) ? v : null;
  } catch {
    return inMemorySchemeFallback;
  }
}

function systemScheme(): ColorScheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

// Split in two (rather than one combined "apply everything" function) so
// callers that only need to converge the DOM to an already-resolved value —
// the mount sync and the declarative `[scheme]` effect below — don't also
// perform a redundant storage write on every render.
function applySchemeAttr(resolved: ColorScheme) {
  // Dark stays the no-attribute default (existing dark rendering is
  // untouched); light is the marked case.
  if (resolved === "light") document.documentElement.dataset.scheme = "light";
  else delete document.documentElement.dataset.scheme;
}

function persistSchemePref(pref: SchemePreference) {
  inMemorySchemeFallback = pref;
  try {
    if (pref) localStorage.setItem(SCHEME_STORAGE_KEY, pref);
    else localStorage.removeItem(SCHEME_STORAGE_KEY);
  } catch {
    // Site data blocked; `inMemorySchemeFallback` above keeps subsequent
    // `getStoredScheme` reads coherent with this choice for the rest of the
    // session, and `applySchemeAttr` (called by every caller of this
    // function) already updated the DOM regardless.
  }
}

let schemeListeners: Array<() => void> = [];

function subscribeScheme(listener: () => void) {
  schemeListeners = [...schemeListeners, listener];
  return () => {
    schemeListeners = schemeListeners.filter((l) => l !== listener);
  };
}

function notifySchemeListeners() {
  schemeListeners.forEach((l) => l());
}

// Two useSyncExternalStore calls read this pair — preference and resolved
// value both need to be stable PRIMITIVES (string | null), never a freshly
// allocated object, or every render would look like a change and loop.
function getSchemePreferenceSnapshot(): SchemePreference {
  return getStoredScheme();
}

function getSchemePreferenceServerSnapshot(): SchemePreference {
  return null;
}

function getResolvedSchemeSnapshot(): ColorScheme {
  if (typeof window === "undefined") return "dark";
  return getStoredScheme() ?? systemScheme();
}

function getResolvedSchemeServerSnapshot(): ColorScheme {
  // Matches the SSR-default dark rendering; the FOUC script in layout.tsx
  // corrects the DOM attribute pre-paint on the client before hydration.
  return "dark";
}

const WorldContext = createContext<{
  world: WorldSlug;
  setWorld: (slug: WorldSlug) => void;
  scheme: ColorScheme;
  schemePreference: SchemePreference;
  setScheme: (pref: SchemePreference) => void;
}>({
  world: DEFAULT_WORLD,
  setWorld: () => {},
  scheme: "dark",
  schemePreference: null,
  setScheme: () => {},
});

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const world = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setWorld = useCallback((slug: WorldSlug) => {
    if (!isValidWorld(slug)) return;
    applyWorld(slug);
    // Notify subscribers so useSyncExternalStore re-reads
    listeners.forEach((l) => l());
  }, []);

  const schemePreference = useSyncExternalStore(
    subscribeScheme,
    getSchemePreferenceSnapshot,
    getSchemePreferenceServerSnapshot,
  );
  const scheme = useSyncExternalStore(
    subscribeScheme,
    getResolvedSchemeSnapshot,
    getResolvedSchemeServerSnapshot,
  );

  const setScheme = useCallback((pref: SchemePreference) => {
    // Write the DOM attribute immediately (synchronous, so a toggle UI gets
    // instant feedback rather than waiting on the next effect flush), then
    // persist the choice and notify subscribers so the snapshot catches up.
    applySchemeAttr(pref ?? systemScheme());
    persistSchemePref(pref);
    notifySchemeListeners();
  }, []);

  // Declarative sync: whenever the resolved snapshot changes for ANY
  // reason — the `setScheme` call above, an OS "change" event while
  // system-follow is active (below), or a future code path this file
  // doesn't know about yet — the DOM attribute converges to match.
  // Attribute-only, no storage write, so it's cheap to run on every
  // `scheme` change, including the very first render (this is also what
  // performs the initial mount sync; the inline FOUC script in layout.tsx
  // already did this before paint in the real app, this covers
  // environments where that script never ran, e.g. tests).
  useEffect(() => {
    applySchemeAttr(scheme);
  }, [scheme]);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;

    const onChange = () => {
      // Only the system-follow path reacts to OS changes. An explicit
      // override must survive a background OS change untouched. No direct
      // DOM write here — notifying causes `scheme` to recompute, and the
      // effect above converges the DOM once that lands.
      if (getStoredScheme() === null) {
        notifySchemeListeners();
      }
    };

    mql.addEventListener?.("change", onChange);
    return () => {
      mql.removeEventListener?.("change", onChange);
    };
  }, []);

  return (
    <WorldContext.Provider
      value={{ world, setWorld, scheme, schemePreference, setScheme }}
    >
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  return useContext(WorldContext);
}
