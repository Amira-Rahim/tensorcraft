"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
} from "react";
import { DEFAULT_THEME, isLaunched } from "@tensorcraft/shared";
import type { ThemeSlug } from "@tensorcraft/shared";

const STORAGE_KEY = "tc-active-theme";

function isValidTheme(value: string): value is ThemeSlug {
  // V1 scope-revert (2026-05-05): only launched themes are settable as the
  // active theme. Coming-soon slugs are stripped at the boundary so a stale
  // localStorage value or hand-edited DOM attribute can't shift the palette.
  return isLaunched(value);
}

function getStoredTheme(): ThemeSlug {
  if (typeof window === "undefined") return DEFAULT_THEME;
  // The try/catch is load-bearing, not defensive habit. `localStorage` does
  // not merely return null when site data is blocked — accessing it THROWS
  // SecurityError (Safari "Block All Cookies", Chrome site-data blocking,
  // enterprise policy, any sandboxed iframe).
  //
  // This function is the `getSnapshot` of a useSyncExternalStore in a
  // provider that wraps the entire app, so it runs DURING RENDER. An
  // unguarded throw here unwound all the way to global-error.tsx — a white
  // screen on every route, including /terms and /privacy, for every user in
  // that configuration. Falling back to the default theme is completely
  // recoverable; crashing is not.
  //
  // The inline bootstrap at layout.tsx:111 already wraps this same API in
  // try/catch, as do ~25 other storage sites in the app. This one was missed.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && isValidTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyTheme(slug: ThemeSlug) {
  document.documentElement.dataset.theme = slug;
  // Same hazard on the write side: the theme still applies to the DOM, it
  // just will not persist across navigations for these users.
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // Site data blocked; the dataset assignment above still took effect.
  }
}

// External store for theme state, lets useSyncExternalStore track changes
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): ThemeSlug {
  return getStoredTheme();
}

function getServerSnapshot(): ThemeSlug {
  return DEFAULT_THEME;
}

const ThemeContext = createContext<{
  theme: ThemeSlug;
  setTheme: (slug: ThemeSlug) => void;
}>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((slug: ThemeSlug) => {
    if (!isValidTheme(slug)) return;
    applyTheme(slug);
    // Notify subscribers so useSyncExternalStore re-reads
    listeners.forEach((l) => l());
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
