"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Exercise } from "@tensorcraft/ui";
import type {
  ExerciseData,
  ExerciseProps,
  ExerciseRunSnapshot,
} from "@tensorcraft/ui";
import type {
  LearningEvidenceSnapshot,
  LearningEvidenceExerciseSlug,
} from "@/lib/learning-evidence-types";
import {
  createLearningEvidence,
  learningEvidenceVersion,
} from "@/lib/learning-evidence-types";
import {
  LearningEvidencePanel,
  useLearningEvidence,
} from "./learning-evidence";

type Props = ExerciseProps & {
  slug: LearningEvidenceExerciseSlug;
  content?: Pick<ExerciseData, "starterCode" | "testCode">;
};

export function LearningEvidenceExercise(props: Props) {
  return (
    <OwnedExercise
      key={`${props.slug}:${props.draftOwner ?? "guest"}`}
      {...props}
    />
  );
}

function OwnedExercise({ content, onRunSnapshot, ...props }: Props) {
  const store = useLearningEvidence(props.draftOwner ?? null, props.slug);
  const [currentRun, setCurrentRun] = useState<LearningEvidenceSnapshot | null>(
    null,
  );
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [captureMessage, setCaptureMessage] = useState("");
  const sequence = useRef(0);
  const mounted = useRef(false);
  const fallbackOwner = useRef<string | null>(null);
  const invalidateCapture = useCallback(() => {
    sequence.current++;
  }, []);
  const starterCode = content?.starterCode;
  const testCode = content?.testCode;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateCapture();
    };
  }, [invalidateCapture]);
  useEffect(() => {
    let active = true;
    if (starterCode !== undefined && testCode !== undefined) {
      void learningEvidenceVersion(starterCode, testCode)
        .then((version) => {
          if (active) setCurrentVersion(version);
        })
        .catch(() => {
          if (active) setCurrentVersion(null);
        });
    }
    return () => {
      active = false;
    };
  }, [starterCode, testCode]);

  const capture = useCallback(
    (run: ExerciseRunSnapshot) => {
      const attempt = ++sequence.current;
      setCurrentRun(null);
      setCaptureMessage("Preparing this run for saving…");
      // A blocked owner-key store must not prevent downloading the current run.
      // This temporary owner is never used for an IndexedDB write.
      fallbackOwner.current ??= `guest:${crypto.randomUUID()}`;
      void createLearningEvidence(
        run,
        store.ownerScope ?? fallbackOwner.current,
      )
        .then((snapshot) => {
          if (!mounted.current || attempt !== sequence.current) return;
          setCurrentRun(snapshot);
          setCaptureMessage("");
        })
        .catch(() => {
          if (mounted.current && attempt === sequence.current)
            setCaptureMessage(
              "This run could not become a saved record. Its current output remains below. Copy your code before leaving.",
            );
        });
      onRunSnapshot?.(run);
    },
    [store.ownerScope, onRunSnapshot],
  );

  return (
    <Exercise
      {...props}
      onRunSnapshot={capture}
      renderSavedRuns={({ currentCode, restore }) => (
        <LearningEvidencePanel
          exerciseSlug={props.slug}
          store={store}
          currentRun={currentRun}
          currentCode={currentCode}
          currentVersion={currentVersion}
          restore={restore}
          captureMessage={captureMessage}
        />
      )}
    />
  );
}
