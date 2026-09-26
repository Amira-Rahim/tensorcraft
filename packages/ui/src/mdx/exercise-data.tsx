"use client";

import { createContext } from "react";
import type { ExerciseData, MLContent } from "./exercise";

/* Shared by the exercise pane (exercise.tsx) and the brief
   (exercise-brief.tsx). exercise.tsx imports Sandpack at module level, so
   everything the brief needs lives here and this file imports no Sandpack
   (spec 2026-09-24, section 3). The type imports above are erased. */

export const ExerciseDataContext = createContext<Map<string, ExerciseData>>(
  new Map(),
);

export function ExerciseDataProvider({
  exercises,
  children,
}: {
  exercises: Map<string, ExerciseData>;
  children: React.ReactNode;
}) {
  return (
    <ExerciseDataContext.Provider value={exercises}>
      {children}
    </ExerciseDataContext.Provider>
  );
}

/* Badge colors are scheme-paired: the dark values are bright pastels that
   sat at 1.5-2.4:1 on the light scheme's white cards (axe, 2026-07-23).
   Light values are the same hues darkened until >=4.6:1 against both
   white and their own `${color}15` tint composited on the light paper
   surface #F5F5F2, the real chip background (axe, 2026-08-12). */
export const difficultyConfig = {
  beginner: { label: "Beginner", color: "#4ADE80", light: "#16773A" },
  intermediate: { label: "Intermediate", color: "#FBBF24", light: "#866103" },
  advanced: { label: "Advanced", color: "#F87171", light: "#CA0A0A" },
};

export const mlContentConfig: Record<
  MLContent,
  { label: string; tone: string; light: string }
> = {
  arithmetic: { label: "Arithmetic", tone: "#9CA3AF", light: "#606877" },
  data: { label: "Tensor Data", tone: "#60A5FA", light: "#0762D3" },
  model: { label: "Model Build", tone: "#A78BFA", light: "#6E44EB" },
  training: { label: "Training", tone: "#F472B6", light: "#C40F6E" },
  evaluation: { label: "Evaluation", tone: "#FB923C", light: "#A74D04" },
  deployment: { label: "Deployment", tone: "#34D399", light: "#1A7554" },
  systems: { label: "Systems", tone: "#F59E0B", light: "#8F5C06" },
};

/* The fallback when the context carries no exercise for the slug. */
export function ExerciseNotFound({ slug }: { slug: string }) {
  return (
    <div className="p-6 my-6 bg-surface-raised border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚡</span>
        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          Exercise
        </h4>
      </div>
      <p className="text-sm text-text-muted">
        Exercise{" "}
        <code className="text-xs px-1.5 py-0.5 bg-surface-overlay text-primary">
          {slug}
        </code>{" "}
        not found.
      </p>
    </div>
  );
}
