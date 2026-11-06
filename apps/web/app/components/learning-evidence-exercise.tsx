"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Exercise, ExerciseOutput } from "@tensorcraft/ui";
import type {
  ExerciseData,
  ExerciseProps,
  ExerciseRunEvent,
  ExerciseRunSnapshot,
} from "@tensorcraft/ui";
import type {
  LearningEvidenceSnapshot,
  LearningEvidenceExerciseSlug,
} from "@/lib/learning-evidence-types";
import {
  createLearningEvidence,
  learningEvidenceVersion,
  canSaveLearningEvidence,
} from "@/lib/learning-evidence-types";
import { resolveEvidenceOwner } from "@/lib/learning-evidence-store";
import {
  LearningEvidencePanel,
  downloadLearningEvidence,
  useLearningEvidence,
} from "./learning-evidence";
import { hasInspectableResult, ResultExplanation } from "./result-explanation";

type Props = ExerciseProps & {
  slug: LearningEvidenceExerciseSlug;
  content?: Pick<ExerciseData, "starterCode" | "testCode">;
};
type CapturedRun = {
  token: string;
  raw: ExerciseRunSnapshot;
  saved: LearningEvidenceSnapshot | null;
  message: string;
};
type Captures = { current: CapturedRun | null; previous: CapturedRun | null };

export function LearningEvidenceExercise(props: Props) {
  return (
    <OwnedExercise
      key={`${props.slug}:${props.draftOwner ?? "guest"}`}
      {...props}
    />
  );
}

function RunResult({
  run,
  currentCode,
}: {
  run: CapturedRun;
  currentCode: string;
}) {
  const complete =
    run.raw.checks.length > 0 &&
    run.raw.checks.every((check) => check.passed) &&
    !run.raw.errored;
  const inspectable = hasInspectableResult(
    run.raw.exerciseSlug,
    run.raw.artifacts,
  );
  return (
    <>
      {run.raw.submittedCode !== currentCode && (
        <p className="my-3 text-warning">
          Your code has changed since this run. These results belong to the
          submitted code.
        </p>
      )}
      {inspectable ? (
        <>
          <ResultExplanation
            exerciseSlug={run.raw.exerciseSlug}
            artifacts={run.raw.artifacts}
            complete={complete}
          />
          <details className="my-4">
            <summary className="min-h-11 cursor-pointer py-2">
              Captured values and run details
            </summary>
            <ExerciseOutput
              artifacts={run.raw.artifacts}
              complete={complete}
              stale={false}
              outputLabel="Captured output"
            />
          </details>
        </>
      ) : (
        <ExerciseOutput
          artifacts={run.raw.artifacts}
          complete={complete}
          stale={false}
        />
      )}
      <p className="text-sm text-text-muted">
        {run.raw.assistance.solutionViewed
          ? "Solution viewed before this run. "
          : "No solution reveal recorded for this draft. "}
        {run.raw.assistance.hintsRevealed.length
          ? `Hint levels opened in this session: ${run.raw.assistance.hintsRevealed.join(", ")}. `
          : "No hint reveals recorded in this session. "}
        Earlier hint use is unknown.
      </p>
    </>
  );
}

function OwnedExercise({
  content,
  onRunSnapshot,
  onRunLifecycle,
  ...props
}: Props) {
  const store = useLearningEvidence(props.draftOwner ?? null, props.slug);
  const owner = resolveEvidenceOwner(props.draftOwner ?? null);
  const [captures, setCaptures] = useState<Captures>({
    current: null,
    previous: null,
  });
  const capturesRef = useRef(captures);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const mounted = useRef(false);
  const epoch = useRef(0);
  const id = useId();
  const invalidateCaptures = useCallback(() => {
    epoch.current++;
  }, []);
  const updateCaptures = useCallback(
    (change: (value: Captures) => Captures) => {
      const next = change(capturesRef.current);
      capturesRef.current = next;
      setCaptures(next);
    },
    [],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateCaptures();
    };
  }, [invalidateCaptures]);
  const starterCode = content?.starterCode;
  const testCode = content?.testCode;
  useEffect(() => {
    let active = true;
    setCurrentVersion(null);
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

  const lifecycle = useCallback(
    (event: ExerciseRunEvent) => {
      if (event.type === "started") {
        updateCaptures((value) => ({
          current: null,
          previous:
            value.current &&
            hasInspectableResult(props.slug, value.current.raw.artifacts)
              ? value.current
              : value.previous,
        }));
      } else if (event.type === "invalidated") {
        if (event.reason === "restore") {
          updateCaptures((value) => ({
            current: null,
            previous:
              value.current &&
              hasInspectableResult(props.slug, value.current.raw.artifacts)
                ? value.current
                : value.previous,
          }));
        } else {
          invalidateCaptures();
          updateCaptures(() => ({ current: null, previous: null }));
        }
      } else {
        const token = event.runToken;
        const raw = event.snapshot;
        const captureEpoch = epoch.current;
        updateCaptures((value) => ({
          current: {
            token,
            raw,
            saved: null,
            message: "Preparing this run…",
          },
          previous: hasInspectableResult(props.slug, raw.artifacts)
            ? null
            : value.previous,
        }));
        // The owner is available independently of IndexedDB loading. Copy/hash once.
        void createLearningEvidence(raw, owner)
          .then((saved) => {
            if (!mounted.current || captureEpoch !== epoch.current) return;
            updateCaptures((value) => ({
              current:
                value.current?.token === token
                  ? { ...value.current, saved, message: "" }
                  : value.current,
              previous:
                value.previous?.token === token
                  ? { ...value.previous, saved, message: "" }
                  : value.previous,
            }));
          })
          .catch(() => {
            if (!mounted.current || captureEpoch !== epoch.current) return;
            const message =
              "This run could not be prepared for saving or download. Its output stays available. Copy your code before leaving.";
            updateCaptures((value) => ({
              current:
                value.current?.token === token
                  ? { ...value.current, message }
                  : value.current,
              previous:
                value.previous?.token === token
                  ? { ...value.previous, message }
                  : value.previous,
            }));
          });
      }
      onRunLifecycle?.(event);
    },
    [owner, props.slug, onRunLifecycle, updateCaptures, invalidateCaptures],
  );

  return (
    <Exercise
      {...props}
      onRunSnapshot={onRunSnapshot}
      onRunLifecycle={lifecycle}
      renderResult={({ attempt, currentCode, editorId }) => {
        const current =
          attempt.status === "settled" &&
          captures.current?.token === attempt.runToken
            ? captures.current
            : null;
        const previous = captures.previous;
        if (!current && !previous) return undefined;
        return (
          <div className="my-6 w-full min-w-0 space-y-5">
            {current && (
              <section
                id={`${id}-current`}
                tabIndex={-1}
                aria-labelledby={`${id}-current-title`}
              >
                <h3
                  id={`${id}-current-title`}
                  className="text-xl font-semibold"
                >
                  Result from this run
                </h3>
                <RunResult run={current} currentCode={currentCode} />
                <a
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                  href={`#${editorId}`}
                >
                  Return to code
                </a>
              </section>
            )}
            {previous && (
              <details
                key={previous.token}
                id={`${id}-previous`}
                tabIndex={-1}
                className="border-t border-border py-4"
              >
                <summary className="min-h-11 cursor-pointer py-2 font-medium">
                  Previous run
                </summary>
                <p className="my-3 text-sm text-text-secondary">
                  These results belong to an earlier attempt. Your latest
                  attempt has its own checks.
                </p>
                <RunResult run={previous} currentCode={currentCode} />
                {previous.saved && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="min-h-11 border border-border px-3 py-2"
                      onClick={() => downloadLearningEvidence(previous.saved!)}
                    >
                      Download previous run
                    </button>
                    {canSaveLearningEvidence(props.slug) && (
                      <button
                        type="button"
                        className="min-h-11 border border-border px-3 py-2 disabled:opacity-50"
                        disabled={
                          store.busy ||
                          store.records.some(
                            (record) => record.runId === previous.saved!.runId,
                          )
                        }
                        onClick={() => void store.save(previous.saved!)}
                      >
                        {store.records.some(
                          (record) => record.runId === previous.saved!.runId,
                        )
                          ? "Previous run saved"
                          : store.mutation?.kind === "save" &&
                              store.mutation.runId === previous.saved.runId
                            ? "Saving previous run…"
                            : "Save previous run"}
                      </button>
                    )}
                  </div>
                )}
                {previous.message && (
                  <p className="mt-3 text-sm" role="status">
                    {previous.message}
                  </p>
                )}
              </details>
            )}
          </div>
        );
      }}
      renderSavedRuns={({ currentCode, restore, restoreAvailable }) => (
        <LearningEvidencePanel
          exerciseSlug={props.slug}
          store={store}
          currentRun={captures.current?.saved}
          currentCode={restoreAvailable ? currentCode : undefined}
          currentVersion={currentVersion}
          restore={restore}
          restoreAvailable={restoreAvailable}
          captureMessage={captures.current?.message}
          onInspectInlineRun={(runId) => {
            const target = document.getElementById(
              `${id}-${captures.current?.saved?.runId === runId ? "current" : "previous"}`,
            );
            if (!target) return;
            if (target instanceof HTMLDetailsElement) target.open = true;
            target.scrollIntoView?.({ block: "start" });
            target.focus({ preventScroll: true });
          }}
          inlineRunIds={[
            captures.current?.saved?.runId,
            captures.previous?.saved?.runId,
          ].filter((runId): runId is string => Boolean(runId))}
        />
      )}
    />
  );
}
