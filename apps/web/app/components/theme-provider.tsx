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
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isValidTheme(stored) ? stored : DEFAULT_THEME;
}

function applyTheme(slug: ThemeSlug) {
  document.documentElement.dataset.theme = slug;
  localStorage.setItem(STORAGE_KEY, slug);
}

// External store for theme state — lets useSyncExternalStore track changes
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
