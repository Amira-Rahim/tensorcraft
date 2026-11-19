"use client";

import { lazy, Suspense } from "react";
import type { ExerciseProps } from "./exercise";

const ExerciseEditor = lazy(() =>
  import("./exercise").then((module) => ({ default: module.Exercise })),
);

/** Keep editor dependencies behind the public component's render boundary. */
export function Exercise(props: ExerciseProps) {
  return (
    <Suspense
      fallback={
        <div className="my-8 border border-border bg-surface rounded-none p-6 text-xs font-mono text-text-muted uppercase tracking-wider">
          Loading editor…
        </div>
      }
    >
      <ExerciseEditor {...props} />
    </Suspense>
  );
}
