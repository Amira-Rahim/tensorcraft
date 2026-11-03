"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExerciseOutput } from "@tensorcraft/ui";
import { NormalizationRunExplanation } from "./normalization-run-explanation";
import { NetworkRunExplanation } from "./network-run-explanation";
import type {
  LearningEvidenceSnapshot,
  LearningEvidenceExerciseSlug,
} from "@/lib/learning-evidence-types";
import {
  deleteLearningEvidence,
  listLearningEvidence,
  resolveEvidenceOwner,
  saveLearningEvidence,
} from "@/lib/learning-evidence-store";

export const NORMALIZATION_HREF =
  "/worlds/deep-orbit/foundations/normalization#step-challenge";
export const NETWORK_HREF =
  "/worlds/deep-orbit/neural-networks/building-a-network#step-challenge";

const presentations = {
  "normalize-data": {
    name: "normalization",
    title: "Your normalization runs",
    description:
      "Keep the statistics and scores your code produced for Farah’s supplied model.",
    href: NORMALIZATION_HREF,
  },
  "simple-network": {
    name: "network",
    title: "Your network runs",
    description:
      "Keep the training settings, loss, and predictions from the model you trained on the synthetic rehearsal batch.",
    href: NETWORK_HREF,
  },
} as const;

const buttonClass =
  "min-h-11 border border-border px-3 py-2 text-sm hover:bg-surface-overlay focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

export function downloadLearningEvidence(snapshot: LearningEvidenceSnapshot) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `tensorcraft-${presentations[snapshot.exerciseSlug].name}-${snapshot.runId}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function useLearningEvidence(
  userId: string | null,
  exerciseSlug: LearningEvidenceExerciseSlug = "normalize-data",
) {
  const [ownerScope, setOwnerScope] = useState<string | null>(null);
  const [records, setRecords] = useState<LearningEvidenceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const mounted = useRef(false);
  const operation = useRef(0);
  const busyRef = useRef(false);
  const invalidateOperation = useCallback(() => {
    operation.current++;
  }, []);
  // Consumers key this hook's subtree by account. An old asynchronous read or
  // save must never update the next account's panel.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateOperation();
    };
  }, [invalidateOperation]);
  const load = useCallback(async () => {
    if (busyRef.current) return;
    const id = ++operation.current;
    const active = () => mounted.current && id === operation.current;
    setLoading(true);
    try {
      const owner = resolveEvidenceOwner(userId);
      setOwnerScope(owner);
      const saved = await listLearningEvidence(owner, exerciseSlug);
      if (!active()) return;
      setRecords(saved);
      setMessage("");
    } catch {
      if (active())
        setMessage(
          "This browser could not read your saved runs. Your current output stays available.",
        );
    } finally {
      if (active()) setLoading(false);
    }
  }, [userId, exerciseSlug]);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (snapshot: LearningEvidenceSnapshot) => {
    if (
      !ownerScope ||
      snapshot.ownerScope !== ownerScope ||
      snapshot.exerciseSlug !== exerciseSlug ||
      busyRef.current
    )
      return;
    busyRef.current = true;
    const id = ++operation.current;
    const active = () => mounted.current && id === operation.current;
    setBusy(true);
    try {
      await saveLearningEvidence(snapshot);
      const saved = await listLearningEvidence(ownerScope, exerciseSlug);
      if (!active()) return;
      setRecords(saved);
      setMessage(
        "Saved in this browser. Your first and latest saved runs stay available here.",
      );
    } catch {
      if (active())
        setMessage(
          "This browser could not save the run. Use Download this run, or delete an older saved run and try again.",
        );
    } finally {
      busyRef.current = false;
      if (active()) {
        setBusy(false);
        setLoading(false);
      }
    }
  };

  const remove = async (runId: string) => {
    if (!ownerScope || busyRef.current) return;
    busyRef.current = true;
    const id = ++operation.current;
    const active = () => mounted.current && id === operation.current;
    setBusy(true);
    try {
      await deleteLearningEvidence(ownerScope, runId);
      const saved = await listLearningEvidence(ownerScope, exerciseSlug);
      if (!active()) return;
      setRecords(saved);
      setMessage(
        "Deleted this saved run. Your editor draft stays as you wrote it.",
      );
    } catch {
      if (active())
        setMessage("This browser could not delete the run. Try again.");
    } finally {
      busyRef.current = false;
      if (active()) {
        setBusy(false);
        setLoading(false);
      }
    }
  };
  return { ownerScope, records, loading, busy, message, load, save, remove };
}

export type LearningEvidenceState = ReturnType<typeof useLearningEvidence>;

function outcomeText(snapshot: LearningEvidenceSnapshot) {
  if (snapshot.runOutcome === "passed") return "All checks passed";
  if (snapshot.runOutcome === "errored")
    return "Run stopped before grading finished";
  if (snapshot.runOutcome === "partial") return "Some checks failed";
  return "Checks failed";
}

export function LearningEvidencePanel({
  exerciseSlug = "normalize-data",
  store,
  currentRun,
  currentCode,
  currentVersion,
  restore,
  project = false,
  captureMessage,
}: {
  exerciseSlug?: LearningEvidenceExerciseSlug;
  store: LearningEvidenceState;
  currentRun?: LearningEvidenceSnapshot | null;
  currentCode?: string;
  currentVersion?: string | null;
  restore?: (code: string, solutionViewed: boolean) => boolean;
  project?: boolean;
  captureMessage?: string;
}) {
  const [restoreMessage, setRestoreMessage] = useState("");
  const presentation = presentations[exerciseSlug];
  const records = store.records.filter(
    (snapshot) => snapshot.exerciseSlug === exerciseSlug,
  );
  const alreadySaved =
    currentRun && store.records.some((r) => r.runId === currentRun.runId);
  return (
    <section
      className="my-6 w-full min-w-0 border border-border bg-surface p-4 sm:p-6"
      aria-label={`Saved ${presentation.name} runs`}
    >
      <h2 className="text-xl font-semibold text-text-primary">
        {presentation.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {presentation.description} This browser keeps your first and latest
        saved runs, including their code and checks. These records do not sync
        across devices.
      </p>
      {currentRun && (
        <div className="mt-4 space-y-3">
          <p className="text-sm" role="status">
            {outcomeText(currentRun)}.
            {currentCode !== undefined &&
            currentCode !== currentRun.submittedCode
              ? " Your code has changed since this run. Saving keeps the code that produced these results."
              : " This run is ready to save."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={
                store.busy ||
                currentRun.ownerScope !== store.ownerScope ||
                Boolean(alreadySaved)
              }
              onClick={() => void store.save(currentRun)}
            >
              {alreadySaved
                ? "Run saved"
                : store.busy
                  ? "Saving…"
                  : "Save this run"}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => downloadLearningEvidence(currentRun)}
            >
              Download this run
            </button>
          </div>
        </div>
      )}
      {captureMessage && (
        <p className="mt-3 text-sm text-warning" role="status">
          {captureMessage}
        </p>
      )}
      {store.message && (
        <p className="mt-3 text-sm" role="status">
          {store.message}
        </p>
      )}
      {restoreMessage && (
        <p className="mt-3 text-sm" role="status">
          {restoreMessage}
        </p>
      )}
      {store.loading ? (
        <p className="mt-4 text-sm" role="status">
          Loading saved runs…
        </p>
      ) : records.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No saved {presentation.name} runs here yet.
          {project ? (
            <>
              {" "}
              <Link
                href={presentation.href}
                className="underline underline-offset-4"
              >
                Open the {presentation.name} exercise
              </Link>
              .
            </>
          ) : (
            " Run your code, then choose Save this run."
          )}
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {records.map((snapshot, index) => {
            const historical = Boolean(
              currentVersion && snapshot.exerciseVersion !== currentVersion,
            );
            const edited =
              currentCode !== undefined &&
              snapshot.submittedCode !== currentCode;
            const staleMessage = historical
              ? "Historical run. The exercise has changed since you saved these results."
              : "Saved results from earlier code. Your current editor contains different code.";
            return (
              <details
                key={snapshot.runId}
                className="py-3"
                open={
                  project && index === records.length - 1 ? true : undefined
                }
              >
                <summary className="min-h-11 cursor-pointer py-2 font-medium">
                  {records.length === 1
                    ? "Saved run"
                    : index === 0
                      ? "First saved run"
                      : "Latest saved run"}
                  {": "}
                  {outcomeText(snapshot)}
                  <span className="mt-1 block text-sm font-normal text-text-muted">
                    {new Date(snapshot.capturedAt).toLocaleString()}
                  </span>
                </summary>
                <div className="space-y-3 text-sm leading-relaxed">
                  <p>Saved in this browser. {snapshot.sourceLabel}</p>
                  <p>
                    Feature order: {snapshot.featureOrder.join(", ")}.{" "}
                    {exerciseSlug === "simple-network"
                      ? "These dimensionless practice features come from a separate synthetic dataset."
                      : "The exercise does not specify physical units."}
                  </p>
                  <p>
                    {snapshot.assistance.solutionViewed
                      ? "Solution viewed before this run."
                      : "No solution reveal recorded for this draft."}
                  </p>
                  <p>
                    {snapshot.assistance.hintsRevealed.length
                      ? `Hint levels opened in this session: ${snapshot.assistance.hintsRevealed.join(", ")}.`
                      : "No hint reveals recorded in this session."}{" "}
                    Earlier hint use is unknown.
                  </p>
                  {(historical || edited) && (
                    <p className="text-warning" role="status">
                      {staleMessage}
                    </p>
                  )}
                  {exerciseSlug === "simple-network" ? (
                    <NetworkRunExplanation
                      artifacts={snapshot.artifacts}
                      complete={snapshot.runOutcome === "passed"}
                    />
                  ) : (
                    <NormalizationRunExplanation
                      artifacts={snapshot.artifacts}
                      complete={snapshot.runOutcome === "passed"}
                    />
                  )}
                  {snapshot.artifacts.length ? (
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2">
                        {exerciseSlug === "simple-network"
                          ? "All captured output"
                          : "All captured tables"}
                      </summary>
                      <ExerciseOutput
                        artifacts={snapshot.artifacts}
                        stale={false}
                        complete={snapshot.runOutcome === "passed"}
                        outputLabel="Output from this saved run"
                        statusMessage={`Captured output. ${outcomeText(snapshot)}.`}
                      />
                    </details>
                  ) : (
                    <p>This run captured no result tables.</p>
                  )}
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2">
                      Checks and run details
                    </summary>
                    <ul className="my-3 space-y-2">
                      {snapshot.checks.map((check, i) => (
                        <li key={i}>
                          <span
                            className={
                              check.passed ? "text-success" : "text-warning"
                            }
                          >
                            {check.passed ? "Passed" : "Failed"}
                          </span>
                          : {check.name}
                          {!check.passed && check.error && (
                            <p className="break-words text-text-muted">
                              {check.error}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p>
                      TensorFlow.js{" "}
                      {snapshot.runtimeVersion ?? "version unavailable"}.
                      Backend: {snapshot.backend ?? "unavailable"}.
                    </p>
                    <p>
                      Fixture: {snapshot.fixtureId}, version{" "}
                      {snapshot.fixtureVersion}. Browser-reported run.
                    </p>
                    <p className="break-all">
                      Code version: <code>{snapshot.codeHash}</code>
                    </p>
                  </details>
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2">
                      Inspect saved code
                    </summary>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words bg-surface-raised p-4 text-xs">
                      <code>{snapshot.submittedCode}</code>
                    </pre>
                  </details>
                  {restore && (
                    <p>
                      Restoring preserves your current draft for recovery. It
                      does not run the saved code.
                      {exerciseSlug === "simple-network" &&
                        " A new run trains a fresh model and may produce different scores."}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {restore ? (
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={store.busy}
                        onClick={() => {
                          const restored = restore(
                            snapshot.submittedCode,
                            snapshot.assistance.solutionViewed,
                          );
                          setRestoreMessage(
                            restored
                              ? snapshot.submittedCode === currentCode
                                ? "This saved code is already in the editor."
                                : "Restored saved code. Use Restore My Code to recover your previous draft. Run the checks again when you’re ready."
                              : "The editor kept your current draft. Resolve its recovery notice before restoring this run.",
                          );
                        }}
                      >
                        Restore saved code
                      </button>
                    ) : (
                      <Link className={buttonClass} href={presentation.href}>
                        Open exercise to restore
                      </Link>
                    )}
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => downloadLearningEvidence(snapshot)}
                    >
                      Download saved run
                    </button>
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={store.busy}
                      onClick={() => void store.remove(snapshot.runId)}
                    >
                      Delete saved run
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
      {!store.loading && (
        <button
          type="button"
          className="mt-3 min-h-11 text-sm underline underline-offset-4"
          disabled={store.busy}
          onClick={() => void store.load()}
        >
          Reload saved runs
        </button>
      )}
    </section>
  );
}
