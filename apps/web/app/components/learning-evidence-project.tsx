"use client";

import { useEffect, useState } from "react";
import { exerciseDraftKey, readExerciseDraft } from "@tensorcraft/ui";
import type { LearningEvidenceExerciseSlug } from "@/lib/learning-evidence-types";

import {
  LearningEvidencePanel,
  useLearningEvidence,
} from "./learning-evidence";
import {
  LearningActivityScope,
  useActivityUser,
} from "./learning-activity-scope";

export function LearningEvidenceProject({
  userId,
  currentVersion,
  starterCode,
  network,
}: {
  userId: string;
  currentVersion: string | null;
  starterCode: string;
  network?: { currentVersion: string | null; starterCode: string };
}) {
  return (
    <LearningActivityScope userId={userId} requireServerIdentity>
      <ProjectRuns currentVersion={currentVersion} starterCode={starterCode} />
      {network && (
        <ProjectRuns
          exerciseSlug="simple-network"
          currentVersion={network.currentVersion}
          starterCode={network.starterCode}
        />
      )}
    </LearningActivityScope>
  );
}

function ProjectRuns({
  currentVersion,
  starterCode,
  exerciseSlug = "normalize-data",
}: {
  currentVersion: string | null;
  starterCode: string;
  exerciseSlug?: LearningEvidenceExerciseSlug;
}) {
  const userId = useActivityUser();
  const store = useLearningEvidence(userId, exerciseSlug);
  const [currentCode, setCurrentCode] = useState<string | undefined>();
  useEffect(() => {
    const read = () => {
      try {
        const draft = readExerciseDraft(
          localStorage.getItem(exerciseDraftKey(exerciseSlug, userId)),
        );
        setCurrentCode(draft?.code ?? starterCode);
      } catch {
        setCurrentCode(undefined);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [userId, starterCode, exerciseSlug]);
  return (
    <div className="mt-8">
      <p className="text-sm font-semibold text-text-secondary">
        {exerciseSlug === "simple-network"
          ? "Model milestone"
          : "Data milestone"}
      </p>
      {exerciseSlug === "simple-network" && (
        <p className="mt-2 text-sm text-text-muted">
          This eight-feature synthetic rehearsal uses a separate dataset from
          normalization. Its scores reuse training rows. Held-out evaluation
          comes later.
        </p>
      )}
      <LearningEvidencePanel
        store={store}
        exerciseSlug={exerciseSlug}
        currentVersion={currentVersion}
        currentCode={currentCode}
        project
      />
    </div>
  );
}
