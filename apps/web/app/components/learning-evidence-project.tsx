"use client";

import { useEffect, useState } from "react";
import type { SystemEvidenceStage } from "@/lib/system-evidence";
import { SystemEvidence } from "./system-evidence";
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
  evaluation,
  stages,
  unavailable = false,
  entitled = true,
}: {
  userId: string;
  currentVersion: string | null;
  starterCode: string;
  network?: { currentVersion: string | null; starterCode: string };
  evaluation?: { currentVersion: string | null; starterCode: string };
  stages?: SystemEvidenceStage[];
  unavailable?: boolean;
  entitled?: boolean;
}) {
  const stageResults = {
    data: (
      <ProjectRuns currentVersion={currentVersion} starterCode={starterCode} />
    ),
    model: network && (
      <ProjectRuns exerciseSlug="simple-network" {...network} />
    ),
    evaluation: evaluation && (
      <ProjectRuns exerciseSlug="deep-scan-eval" {...evaluation} />
    ),
  };
  return (
    <LearningActivityScope userId={userId} requireServerIdentity>
      {stages ? (
        <SystemEvidence
          userId={userId}
          stages={stages}
          unavailable={unavailable}
          entitled={entitled}
          stageResults={stageResults}
        />
      ) : (
        <>
          {stageResults.data}
          {stageResults.model}
          {stageResults.evaluation}
        </>
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
          : exerciseSlug === "deep-scan-eval"
            ? "Evaluation milestone"
            : "Data milestone"}
      </p>
      {exerciseSlug === "simple-network" && (
        <p className="mt-2 text-sm text-text-muted">
          This eight-feature synthetic rehearsal uses a separate dataset from
          normalization. Its scores reuse training rows. Held-out evaluation
          comes later.
        </p>
      )}
      {exerciseSlug === "deep-scan-eval" && (
        <p className="mt-2 text-sm text-text-muted">
          This prototype uses 100 training rows and 43 held-out practice cases.
          It is separate from the eight-feature network rehearsal and the
          room-project checkpoint below.
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
