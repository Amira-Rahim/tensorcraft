"use client";

import { Exercise } from "@tensorcraft/ui";
import type { ExerciseProps } from "@tensorcraft/ui";
import { readLessonResultExplanation } from "@/lib/lesson-result-explanations";
import { LessonResultExplanation } from "./lesson-result-explanation";

export function LessonResultExercise(
  props: Omit<ExerciseProps, "renderResult">,
) {
  return (
    <Exercise
      {...props}
      key={`${props.slug}:${props.draftOwner ?? "guest"}`}
      renderResult={({ attempt, currentCode }) => {
        if (
          attempt.status !== "settled" ||
          attempt.snapshot.exerciseSlug !== props.slug
        )
          return undefined;
        const result = readLessonResultExplanation(
          props.slug,
          attempt.snapshot.artifacts,
        );
        if (!result) return undefined;
        const snapshot = attempt.snapshot;
        return (
          <LessonResultExplanation
            key={attempt.runToken}
            result={result}
            artifacts={snapshot.artifacts}
            scopeLabel={
              props.titled
                ? props.slug === "incident-tensor-leak"
                  ? "Tensor capacity estimate"
                  : props.slug === "inference-pipeline"
                    ? "Inference pipeline"
                    : props.slug.replace(/-/g, " ")
                : undefined
            }
            stale={snapshot.submittedCode !== currentCode}
            complete={
              !snapshot.errored &&
              snapshot.checks.length > 0 &&
              snapshot.checks.every((check) => check.passed)
            }
          />
        );
      }}
    />
  );
}
