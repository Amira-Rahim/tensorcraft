"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExerciseOutput } from "@tensorcraft/ui";
import { ResultExplanation } from "./result-explanation";
import { canSaveLearningEvidence } from "@/lib/learning-evidence-types";
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

export const EVALUATION_HREF =
  "/worlds/deep-orbit/training-loop/evaluating-deep-scan#step-challenge";

const presentations = {
  "deep-scan-eval": {
    name: "evaluation",
    title: "Your evaluation runs",
    description:
      "Keep the measured decisions and their source limits for the prototype review.",
    href: EVALUATION_HREF,
  },
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
  const ownerScope = resolveEvidenceOwner(userId);
  const scopeKey = `${ownerScope}:${exerciseSlug}`;
  const scope = useMemo(() => ({ key: scopeKey }), [scopeKey]);
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const [records, setRecords] = useState<LearningEvidenceSnapshot[]>([]);
  const [loadedScope, setLoadedScope] = useState<typeof scope | null>(null);
  const [readScope, setReadScope] = useState<typeof scope | null>(null);
  const [loading, setLoading] = useState(true);
  const [readFailed, setReadFailed] = useState(false);
  const [mutation, setMutation] = useState<{
    scope: typeof scope;
    id: number;
    kind: "save" | "delete";
    runId: string;
  } | null>(null);
  const [notice, setNotice] = useState<{
    scope: typeof scope;
    text: string;
  } | null>(null);
  const mounted = useRef(false);
  const operation = useRef(0);
  const invalidateOperation = useCallback(() => {
    operation.current++;
  }, []);
  const busyRef = useRef<{ scope: typeof scope; id: number } | null>(null);
  const refreshPending = useRef<typeof scope | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateOperation();
    };
  }, [invalidateOperation]);

  const load = useCallback(async () => {
    if (!mounted.current || activeScope.current !== scope) return;
    if (
      busyRef.current?.scope === scope &&
      busyRef.current.id === operation.current
    ) {
      refreshPending.current = scope;
      return;
    }
    const id = ++operation.current;
    const active = () =>
      mounted.current &&
      id === operation.current &&
      activeScope.current === scope;
    setReadScope(scope);
    setLoading(true);
    try {
      const saved = await listLearningEvidence(ownerScope, exerciseSlug);
      if (!active()) return;
      setRecords(saved);
      setLoadedScope(scope);
      setReadFailed(false);
      setNotice(null);
    } catch {
      if (active()) {
        setReadFailed(true);
        setNotice({
          scope,
          text: "This browser could not read your saved runs. Previously loaded entries may be out of date. Your current output stays available.",
        });
      }
    } finally {
      if (active()) setLoading(false);
    }
  }, [ownerScope, exerciseSlug, scope]);
  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      invalidateOperation();
    };
  }, [load, invalidateOperation]);

  const mutate = async (
    kind: "save" | "delete",
    runId: string,
    action: () => Promise<void>,
  ) => {
    if (!mounted.current || activeScope.current !== scope) return;
    if (
      busyRef.current?.scope === scope &&
      busyRef.current.id === operation.current
    )
      return;
    const id = ++operation.current;
    const ticket = { scope, id };
    busyRef.current = ticket;
    const active = () =>
      mounted.current &&
      id === operation.current &&
      activeScope.current === scope;
    setMutation({ ...ticket, kind, runId });
    setNotice(null);
    let committed = false;
    try {
      await action();
      committed = true;
      if (!active()) return;
      setNotice({
        scope,
        text:
          kind === "save"
            ? "Saved in this browser. Your earliest retained and latest saved runs stay available here."
            : "Deleted this saved run. Your editor draft stays as you wrote it.",
      });
      const saved = await listLearningEvidence(ownerScope, exerciseSlug);
      if (!active()) return;
      setRecords(saved);
      setLoadedScope(scope);
      setReadScope(scope);
      setReadFailed(false);
    } catch {
      if (active()) {
        if (committed) {
          setReadFailed(true);
          setNotice({
            scope,
            text:
              kind === "save"
                ? "Saved in this browser, but the saved list could not refresh. Choose Refresh saved runs to check it."
                : "Deleted the run, but the saved list could not refresh. Choose Refresh saved runs to check it.",
          });
        } else {
          // The mutation superseded any pending read. An unread list is unknown.
          if (loadedScope !== scope) setReadFailed(true);
          setNotice({
            scope,
            text:
              kind === "save"
                ? "This browser could not save the run. Download this run to keep a copy. You can retry, or remove an entry from a readable saved list to make room."
                : "This browser could not delete the run. Your saved list may need to refresh before you try again.",
          });
        }
      }
    } finally {
      if (busyRef.current === ticket) busyRef.current = null;
      if (active()) {
        setMutation(null);
        setLoading(false);
        if (refreshPending.current === scope) {
          refreshPending.current = null;
          void load();
        }
      }
    }
  };
  const save = async (snapshot: LearningEvidenceSnapshot) => {
    if (
      snapshot.ownerScope !== ownerScope ||
      snapshot.exerciseSlug !== exerciseSlug ||
      !canSaveLearningEvidence(exerciseSlug)
    )
      return;
    await mutate("save", snapshot.runId, async () => {
      await saveLearningEvidence(snapshot);
    });
  };
  const remove = async (runId: string) => {
    await mutate("delete", runId, async () => {
      await deleteLearningEvidence(ownerScope, runId);
    });
  };
  return {
    ownerScope,
    records: loadedScope === scope ? records : [],
    loading: readScope !== scope || loading,
    readFailed: readScope === scope && readFailed,
    busy: mutation?.scope === scope,
    mutation: mutation?.scope === scope ? mutation : null,
    message: notice?.scope === scope ? notice.text : "",
    load,
    save,
    remove,
  };
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
  restoreAvailable = true,
  inlineRunId,
  inlineRunIds = [],
  onInspectInlineRun,
}: {
  exerciseSlug?: LearningEvidenceExerciseSlug;
  store: LearningEvidenceState;
  currentRun?: LearningEvidenceSnapshot | null;
  currentCode?: string;
  currentVersion?: string | null;
  restore?: (code: string, solutionViewed: boolean) => boolean;
  project?: boolean;
  captureMessage?: string;
  restoreAvailable?: boolean;
  inlineRunId?: string;
  inlineRunIds?: readonly string[];
  onInspectInlineRun?: (runId: string) => void;
}) {
  const [restoreMessage, setRestoreMessage] = useState("");
  const [openSavedId, setOpenSavedId] = useState<string | null>(null);
  const presentation = presentations[exerciseSlug];
  const records = store.records.filter(
    (snapshot) => snapshot.exerciseSlug === exerciseSlug,
  );
  const alreadySaved =
    currentRun && store.records.some((r) => r.runId === currentRun.runId);
  return (
    <section
      className="my-6 w-full min-w-0 border-t border-border py-4 sm:py-6"
      aria-label={`Saved ${presentation.name} runs`}
    >
      <h2 className="text-xl font-semibold text-text-primary">
        {presentation.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {presentation.description} This browser keeps your earliest retained and
        latest saved runs, including their code and checks. These records do not
        sync across devices.
      </p>
      {currentRun && (
        <div className="mt-4 space-y-3">
          <p className="text-sm" role="status">
            {outcomeText(currentRun)}.
            {currentCode !== undefined &&
            currentCode !== currentRun.submittedCode
              ? " Your code has changed since this run. Saving keeps the code that produced these results."
              : canSaveLearningEvidence(exerciseSlug)
                ? " This run is ready to save."
                : " This run is ready to download."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={
                store.busy ||
                !canSaveLearningEvidence(exerciseSlug) ||
                currentRun.ownerScope !== store.ownerScope ||
                Boolean(alreadySaved)
              }
              onClick={() => void store.save(currentRun)}
            >
              {alreadySaved
                ? "Run saved"
                : store.mutation?.kind === "save" &&
                    store.mutation.runId === currentRun.runId
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
      {currentRun && !canSaveLearningEvidence(exerciseSlug) && (
        <p className="mt-3 text-sm text-text-muted">
          Saving evaluation runs is not available in this release. You can
          download this run.
        </p>
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
      <button
        type="button"
        className={`${buttonClass} mt-3`}
        disabled={store.busy || store.loading}
        onClick={() => void store.load()}
      >
        Refresh saved runs
      </button>
      {store.loading ? (
        <p className="mt-4 text-sm" role="status">
          Loading saved runs…
        </p>
      ) : records.length === 0 && store.readFailed ? (
        <p className="mt-4 text-sm text-warning">
          Saved history is unavailable. Refresh the list to try again.
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
          ) : canSaveLearningEvidence(exerciseSlug) ? (
            " Run your code, then choose Save this run."
          ) : (
            " You can inspect and download new runs from this lesson."
          )}
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {records.map((snapshot, index) => {
            const shownAbove =
              snapshot.runId === inlineRunId ||
              inlineRunIds.includes(snapshot.runId);
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
                open={openSavedId === snapshot.runId}
                onToggle={(event) => {
                  if (event.currentTarget.open) setOpenSavedId(snapshot.runId);
                  else
                    setOpenSavedId((current) =>
                      current === snapshot.runId ? null : current,
                    );
                }}
              >
                <summary className="min-h-11 cursor-pointer py-2 font-medium">
                  {records.length === 1
                    ? "Saved run"
                    : index === 0
                      ? "Earlier saved run"
                      : "Latest saved run"}
                  {": "}
                  {outcomeText(snapshot)}
                  <span className="mt-1 block text-sm font-normal text-text-muted">
                    Run from {new Date(snapshot.capturedAt).toLocaleString()}
                  </span>
                </summary>
                <div className="space-y-3 text-sm leading-relaxed">
                  <p className="text-sm">
                    Saved in this browser. {snapshot.sourceLabel}
                  </p>
                  {exerciseSlug !== "deep-scan-eval" && (
                    <p className="text-sm">
                      Feature order: {snapshot.featureOrder.join(", ")}.{" "}
                      {exerciseSlug === "simple-network"
                        ? "These dimensionless practice features come from a separate synthetic dataset."
                        : "The exercise does not specify physical units."}
                    </p>
                  )}
                  <p className="text-sm">
                    {snapshot.assistance.solutionViewed
                      ? "Solution viewed before this run."
                      : "No solution reveal recorded for this draft."}
                  </p>
                  <p className="text-sm">
                    {snapshot.assistance.hintsRevealed.length
                      ? `Hint levels opened in this session: ${snapshot.assistance.hintsRevealed.join(", ")}.`
                      : "No hint reveals recorded in this session."}{" "}
                    Earlier hint use is unknown.
                  </p>
                  {(historical || edited) && (
                    <p className="text-sm text-warning" role="status">
                      {staleMessage}
                    </p>
                  )}
                  {!shownAbove ? (
                    <ResultExplanation
                      exerciseSlug={exerciseSlug}
                      artifacts={snapshot.artifacts}
                      complete={snapshot.runOutcome === "passed"}
                    />
                  ) : (
                    <div>
                      <p className="text-sm">
                        This run has an inspection view above. Its saved copy is
                        available in this browser.
                      </p>
                      {onInspectInlineRun && (
                        <button
                          type="button"
                          className={`${buttonClass} mt-2`}
                          onClick={() => onInspectInlineRun(snapshot.runId)}
                        >
                          Inspect this run above
                        </button>
                      )}
                    </div>
                  )}
                  {shownAbove ? null : snapshot.artifacts.length ? (
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
                    <p className="text-sm">
                      This run captured no result tables.
                    </p>
                  )}
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2">
                      Checks and run details
                    </summary>
                    <ul className="my-3 space-y-2">
                      {snapshot.checks.map((check, i) => (
                        <li key={i} className="text-sm">
                          <span
                            className={
                              check.passed ? "text-success" : "text-warning"
                            }
                          >
                            {check.passed ? "Passed" : "Failed"}
                          </span>
                          : {check.name}
                          {!check.passed && check.error && (
                            <p className="break-words text-sm text-text-muted">
                              {check.error}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm">
                      TensorFlow.js{" "}
                      {snapshot.runtimeVersion ?? "version unavailable"}.
                      Backend: {snapshot.backend ?? "unavailable"}.
                    </p>
                    <p className="text-sm">
                      Fixture: {snapshot.fixtureId}, version{" "}
                      {snapshot.fixtureVersion}. Browser-reported run.
                    </p>
                    <p className="break-all text-sm">
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
                    <p className="text-sm">
                      Restoring preserves your current draft for recovery. It
                      does not run the saved code.
                      {exerciseSlug !== "normalize-data" &&
                        " A new run trains a fresh model and may produce different scores."}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {restore ? (
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={store.busy || !restoreAvailable}
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
    </section>
  );
}
