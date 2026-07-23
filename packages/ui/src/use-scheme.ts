"use client";

import { useSyncExternalStore } from "react";
import type { ColorScheme } from "@tensorcraft/shared";

export type { ColorScheme } from "@tensorcraft/shared";

// ---------------------------------------------------------------------------
// packages/ui components (CodeBlock, Exercise, SceneCanvas, ...) can't import
// apps/web's ThemeProvider — that would create a reverse dependency from the
// shared component library onto the app. Instead they observe the DOM: the
// app-side provider (apps/web/app/components/theme-provider.tsx) is the only
// writer of `document.documentElement.dataset.scheme`, and this hook is a
// read-only mirror of that attribute. THE ATTRIBUTE IS THE STORE.
//
// Mirrors theme-provider's module-level listener-array + useSyncExternalStore
// pattern, but the underlying subscription primitive is a single shared
// MutationObserver (refcounted) rather than a plain listener array, since
// there is no app-level notifier this module can hook into directly.
// ---------------------------------------------------------------------------

let listeners: Array<() => void> = [];
let observer: MutationObserver | null = null;

function notifyListeners() {
  listeners.forEach((l) => l());
}

function ensureObserver() {
  // First subscriber creates the observer. Guarded for SSR/module-eval
  // safety — this only ever runs from `subscribe`, which React only calls
  // client-side (after mount), but the guard costs nothing and keeps this
  // function safe to call from anywhere.
  if (observer || typeof document === "undefined") return;
  observer = new MutationObserver(notifyListeners);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-scheme"],
  });
}

function teardownObserverIfIdle() {
  if (listeners.length === 0 && observer) {
    observer.disconnect();
    observer = null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  ensureObserver();
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    teardownObserverIfIdle();
  };
}

// Reads straight off the live DOM attribute — no allocation, primitive
// return, safe to call every render (required for useSyncExternalStore:
// a snapshot that allocates a new value each call looks like a change on
// every render and loops).
function getSnapshot(): ColorScheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.scheme === "light" ? "light" : "dark";
}

// Matches the SSR-default dark rendering used app-wide; the app's FOUC
// script / provider corrects the DOM attribute pre-paint on the client.
export function getServerSnapshot(): ColorScheme {
  return "dark";
}

/**
 * Read-only mirror of the app's `data-scheme` attribute on `<html>`, for
 * packages/ui components that need to know the resolved light/dark scheme
 * but must not depend on apps/web's ThemeProvider.
 */
export function useScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
