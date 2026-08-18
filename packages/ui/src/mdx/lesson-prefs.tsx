"use client";

import { createContext, useContext } from "react";

/**
 * Per-learner lesson rendering preferences.
 *
 * Exists so onboarding's "calibrate to your level" promise is TRUE: the
 * 2026-07-13 value audit found experience_level was collected, stored, and
 * consumed by nothing. `expandDerivations` is the first real consumer:
 * advanced/expert learners get <DerivationDrawer> math opened by default,
 * everyone else keeps the closed-by-default JS-bridge pedagogy.
 *
 * Default (no provider) preserves historic behavior: everything closed.
 */
export interface LessonPrefs {
  expandDerivations: boolean;
}

const LessonPrefsContext = createContext<LessonPrefs>({
  expandDerivations: false,
});

export function LessonPrefsProvider({
  value,
  children,
}: {
  value: LessonPrefs;
  children: React.ReactNode;
}) {
  return (
    <LessonPrefsContext.Provider value={value}>
      {children}
    </LessonPrefsContext.Provider>
  );
}

export function useLessonPrefs(): LessonPrefs {
  return useContext(LessonPrefsContext);
}
