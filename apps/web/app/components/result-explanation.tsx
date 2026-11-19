"use client";

import type { ExerciseArtifact } from "@tensorcraft/ui";
import { decodeEvaluationResult } from "@tensorcraft/shared";
import { EvaluationRunExplanation } from "./evaluation-run-explanation";
import {
  NormalizationRunExplanation,
  readNormalizationRun,
} from "./normalization-run-explanation";
import {
  NetworkRunExplanation,
  readNetworkRun,
} from "./network-run-explanation";

export function hasInspectableResult(
  exerciseSlug: string,
  artifacts: ExerciseArtifact[],
): boolean {
  if (exerciseSlug === "normalize-data")
    return readNormalizationRun(artifacts) !== null;
  if (exerciseSlug === "simple-network")
    return readNetworkRun(artifacts) !== null;
  if (exerciseSlug === "deep-scan-eval") {
    const result = decodeEvaluationResult(artifacts);
    return result.integrity.status !== "invalid" && result.cases.length > 0;
  }
  return false;
}

export function ResultExplanation({
  exerciseSlug,
  artifacts,
  complete,
}: {
  exerciseSlug: string;
  artifacts: ExerciseArtifact[];
  complete: boolean;
}) {
  if (!hasInspectableResult(exerciseSlug, artifacts)) return null;
  if (exerciseSlug === "normalize-data")
    return (
      <NormalizationRunExplanation artifacts={artifacts} complete={complete} />
    );
  if (exerciseSlug === "simple-network")
    return <NetworkRunExplanation artifacts={artifacts} complete={complete} />;
  if (exerciseSlug === "deep-scan-eval")
    return (
      <EvaluationRunExplanation artifacts={artifacts} complete={complete} />
    );
  return null;
}
