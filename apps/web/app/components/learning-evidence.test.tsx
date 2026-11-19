import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ExerciseAttemptState,
  ExerciseProps,
  ExerciseRunSnapshot,
} from "@tensorcraft/ui";
import type { LearningEvidenceSnapshot } from "@/lib/learning-evidence-types";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  canSave: vi.fn(),
  run: null as ExerciseRunSnapshot | null,
  restore: vi.fn(),
}));

vi.mock("@/lib/learning-evidence-store", () => ({
  resolveEvidenceOwner: (owner: string | null) =>
    owner ? `account:${owner}` : "guest:browser",
  listLearningEvidence: mocks.list,
  saveLearningEvidence: mocks.save,
  deleteLearningEvidence: mocks.remove,
}));
vi.mock("@/lib/learning-evidence-types", () => ({
  learningEvidenceVersion: async () => "current-version",
  createLearningEvidence: mocks.create,
  canSaveLearningEvidence: mocks.canSave,
}));
vi.mock("@tensorcraft/ui", async () => {
  const { useId, useRef, useState } = await import("react");
  return {
    Exercise: (props: ExerciseProps) => {
      const [code, setCode] = useState("newer draft");
      const [attempt, setAttempt] = useState<ExerciseAttemptState>({
        status: "idle",
      });
      const sequence = useRef(0);
      const pendingToken = useRef<string | null>(null);
      const instance = useId();
      const start = () => {
        const runToken = `${instance}:${++sequence.current}`;
        pendingToken.current = runToken;
        setAttempt({ status: "running", runToken });
        props.onRunLifecycle?.({ type: "started", runToken });
        return runToken;
      };
      const finish = (runToken = pendingToken.current) => {
        if (!runToken) return;
        pendingToken.current = null;
        const snapshot = mocks.run!;
        setAttempt({ status: "settled", runToken, snapshot });
        props.onRunLifecycle?.({ type: "captured", runToken, snapshot });
        props.onRunSnapshot?.(snapshot);
      };
      return (
        <>
          <input
            aria-label="Editor code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={() => finish(start())}>Run tests</button>
          <button onClick={start}>Start run</button>
          <button onClick={() => finish()}>Finish run</button>
          <button
            onClick={() => {
              pendingToken.current = null;
              setAttempt({ status: "idle" });
              props.onRunLifecycle?.({ type: "invalidated", reason: "reset" });
            }}
          >
            Reset
          </button>
          {props.renderResult?.({
            attempt,
            currentCode: code,
            editorId: "mock-editor",
            resultId: "mock-result",
          })}
          {props.renderSavedRuns?.({
            currentCode: code,
            restoreAvailable: true,
            restore: (source, solutionViewed) => {
              mocks.restore(source, solutionViewed);
              if (source !== code) {
                setAttempt({ status: "idle" });
                props.onRunLifecycle?.({
                  type: "invalidated",
                  reason: "restore",
                });
              }
              setCode(source);
              return true;
            },
          })}
        </>
      );
    },
    ExerciseOutput: ({
      artifacts,
      statusMessage,
      stale,
      staleMessage,
    }: {
      artifacts: unknown;
      statusMessage: string;
      stale: boolean;
      staleMessage: string;
    }) => (
      <div aria-label="Saved output">
        {stale ? staleMessage : statusMessage}
        <pre>{JSON.stringify(artifacts)}</pre>
      </div>
    ),
  };
});

import { LearningEvidenceExercise } from "./learning-evidence-exercise";
import { useLearningEvidence } from "./learning-evidence";

function record(
  overrides: Partial<LearningEvidenceSnapshot> = {},
): LearningEvidenceSnapshot {
  return {
    schemaVersion: 1,
    runId: "first-run",
    ownerScope: "account:alice",
    worldId: "deep-orbit",
    moduleId: "foundations",
    lessonId: "normalization",
    exerciseSlug: "normalize-data",
    milestoneId: "reusable-scaling",
    capturedAt: "2026-11-02T10:00:00.000Z",
    exerciseVersion: "current-version",
    starterHash: "starter-hash",
    testHash: "test-hash",
    runtimeVersion: "4.22.0",
    backend: "cpu",
    codeHash: "first-code-hash",
    submittedCode: "saved code",
    fixtureId: "normalization-four-readings",
    fixtureVersion: "1",
    sourceLabel: "Supplied two-feature practice readings",
    selectedRowIds: [1],
    actualSelectedValues: [[20, 0.2]],
    featureOrder: ["Temperature", "Signal strength"],
    units: ["unspecified", "unspecified"],
    artifacts: [
      {
        kind: "table",
        title: "Captured statistics",
        columns: ["Mean"],
        rows: [[23]],
      },
    ],
    checks: [{ name: "Statistics are reusable", passed: true }],
    runOutcome: "passed",
    assistance: {
      hintsRevealed: [1],
      hintHistory: "session-only",
      solutionViewed: false,
    },
    origin: "browser exercise run",
    ...overrides,
  };
}

const content = { starterCode: "starter", testCode: "private authored tests" };

function networkRecord(): LearningEvidenceSnapshot {
  return record({
    runId: "network-run",
    exerciseSlug: "simple-network",
    moduleId: "neural-networks",
    lessonId: "building-a-network",
    milestoneId: "first-trained-network",
    fixtureId: "synthetic-eight-feature-rehearsal",
    sourceLabel: "Supplied 120-row synthetic training rehearsal",
    submittedCode: "saved network code",
    artifacts: [],
    selectedRowIds: [],
    actualSelectedValues: [],
    featureOrder: ["Amplitude proxy"],
    units: ["dimensionless practice value"],
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function inspectableArtifacts(): ExerciseRunSnapshot["artifacts"] {
  return [
    {
      kind: "table",
      title: "Input readings",
      columns: ["Reading", "Temperature", "Signal strength"],
      rows: [
        [1, 20, 0.2],
        [2, 24, 0.4],
      ],
    },
    {
      kind: "table",
      title: "Saved training statistics",
      columns: ["Feature", "Mean", "Standard deviation"],
      rows: [
        ["Temperature", 22, 2],
        ["Signal strength", 0.3, 0.1],
      ],
    },
    {
      kind: "table",
      title: "Scaled readings entering Farah's preview",
      columns: [
        "Reading",
        "Temperature z-score",
        "Signal z-score",
        "Model score",
      ],
      rows: [
        [1, -1, -1, 0.2],
        [2, 1, 1, 0.8],
      ],
    },
  ];
}

describe("saved normalization runs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.canSave.mockReturnValue(true);
    mocks.list.mockResolvedValue([record()]);
    mocks.save.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
    mocks.create.mockResolvedValue(record({ runId: "latest-run" }));
    mocks.run = {
      exerciseSlug: "normalize-data",
      submittedCode: "latest code",
      starterCode: "starter",
      testCode: "tests",
      capturedAt: "2026-11-02T11:00:00.000Z",
      artifacts: [],
      checks: [{ name: "Correct scale", passed: false }],
      errored: false,
      runtimeVersion: "4.22.0",
      backend: "cpu",
      assistance: {
        hintsRevealed: [],
        hintHistory: "session-only",
        solutionViewed: false,
      },
    };
  });

  it("discards capture preparation that finishes after reset", async () => {
    const preparation = deferred<LearningEvidenceSnapshot>();
    mocks.create.mockReturnValue(preparation.promise);
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    expect(screen.getByText("Preparing this run…")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await act(async () => preparation.resolve(record({ runId: "reset-run" })));
    expect(
      screen.queryByRole("button", { name: "Save this run" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Result from this run" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Preparing this run…")).not.toBeInTheDocument();
  });

  it.each(["rerun", "restore"])(
    "finishes preparing an inspectable previous run after %s",
    async (action) => {
      const preparation = deferred<LearningEvidenceSnapshot>();
      mocks.run = { ...mocks.run!, artifacts: inspectableArtifacts() };
      mocks.create.mockReturnValue(preparation.promise);
      render(
        <LearningEvidenceExercise
          slug="normalize-data"
          draftOwner="alice"
          content={content}
        />,
      );
      fireEvent.click(await screen.findByText("Saved run: All checks passed"));
      fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
      expect(
        screen.getByRole("heading", { name: "A reading from this run" }),
      ).toBeVisible();
      if (action === "rerun")
        fireEvent.click(screen.getByRole("button", { name: "Start run" }));
      else
        fireEvent.click(
          screen.getByRole("button", { name: "Restore saved code" }),
        );
      const previous = screen.getByText("Previous run").closest("details")!;
      expect(previous).not.toHaveAttribute("open");
      await act(async () =>
        preparation.resolve(
          record({ runId: "previous-run", artifacts: inspectableArtifacts() }),
        ),
      );
      fireEvent.click(screen.getByText("Previous run"));
      expect(
        within(previous).getByRole("button", { name: "Download previous run" }),
      ).toBeEnabled();
      expect(
        within(previous).getByRole("button", { name: "Save previous run" }),
      ).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Save this run" }),
      ).not.toBeInTheDocument();
    },
  );

  it("prepares and saves with the actual owner before the initial history read finishes", async () => {
    const initial = deferred<LearningEvidenceSnapshot[]>();
    const current = record({
      runId: "early-run",
      submittedCode: "newer draft",
    });
    mocks.list
      .mockReturnValueOnce(initial.promise)
      .mockResolvedValue([current]);
    mocks.create.mockResolvedValue(current);
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    const save = await screen.findByRole("button", { name: "Save this run" });
    expect(mocks.create).toHaveBeenCalledWith(mocks.run, "account:alice");
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await screen.findByText(
      "Saved in this browser. Your earliest retained and latest saved runs stay available here.",
    );
    expect(mocks.save).toHaveBeenCalledWith(current);
    await act(async () => initial.resolve([]));
    expect(screen.getByRole("button", { name: "Run saved" })).toBeDisabled();
  });

  it("opens and focuses a retained previous result from its saved entry without duplicating the viewer", async () => {
    const saved = record({
      runId: "saved-a",
      submittedCode: "newer draft",
      artifacts: inspectableArtifacts(),
    });
    mocks.list.mockResolvedValueOnce([]).mockResolvedValue([saved]);
    mocks.run = {
      ...mocks.run!,
      submittedCode: "newer draft",
      artifacts: inspectableArtifacts(),
      checks: [{ name: "Correct scale", passed: true }],
    };
    mocks.create
      .mockResolvedValueOnce(saved)
      .mockResolvedValueOnce(
        record({ runId: "failed-b", artifacts: [], runOutcome: "errored" }),
      );
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText(/No saved normalization runs here yet/);
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Save this run" }),
    );
    await screen.findByText("Saved run: All checks passed");
    mocks.run = { ...mocks.run!, artifacts: [], checks: [], errored: true };
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    const previous = screen.getByText("Previous run").closest("details")!;
    expect(previous).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Saved run: All checks passed"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Inspect this run above" }),
    );
    expect(previous).toHaveAttribute("open");
    expect(previous).toHaveFocus();
    expect(
      within(previous).getByRole("heading", {
        name: "A reading from this run",
      }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("heading", {
        name: "A reading from this run",
        hidden: true,
      }),
    ).toHaveLength(1);
  });

  it("does not claim an unread history is empty when saving interrupts its initial read and fails", async () => {
    const initial = deferred<LearningEvidenceSnapshot[]>();
    mocks.list
      .mockReturnValueOnce(initial.promise)
      .mockResolvedValue([record()]);
    mocks.save.mockRejectedValue(new Error("write failed"));
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Save this run" }),
    );
    expect(
      await screen.findByText(/This browser could not save the run/),
    ).toBeVisible();
    expect(screen.getByText(/Saved history is unavailable/)).toBeVisible();
    expect(
      screen.queryByText(/No saved normalization runs here yet/),
    ).not.toBeInTheDocument();
    await act(async () => initial.resolve([]));
    expect(screen.getByText(/Saved history is unavailable/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Refresh saved runs" }));
    expect(
      await screen.findByText("Saved run: All checks passed"),
    ).toBeVisible();
  });

  it("keeps a pending save attached to run A while run B becomes current", async () => {
    const saving = deferred<void>();
    const first = record({ runId: "run-a", submittedCode: "newer draft" });
    const second = record({ runId: "run-b", submittedCode: "newer draft" });
    mocks.list.mockResolvedValueOnce([]).mockResolvedValue([first]);
    mocks.create.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    mocks.save.mockReturnValue(saving.promise);
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText(/No saved normalization runs here yet/);
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Save this run" }),
    );
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    expect(
      await screen.findByRole("button", { name: "Save this run" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Saving…" }),
    ).not.toBeInTheDocument();
    await act(async () => saving.resolve());
    expect(screen.getByRole("button", { name: "Save this run" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Run saved" }),
    ).not.toBeInTheDocument();
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith(first);
  });

  it("reports a committed save separately from a failed history refresh", async () => {
    mocks.list
      .mockResolvedValueOnce([])
      .mockRejectedValue(new Error("read failed"));
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText(/No saved normalization runs here yet/);
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Save this run" }),
    );
    expect(
      await screen.findByText(
        /Saved in this browser, but the saved list could not refresh/,
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(/This browser could not save the run/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No saved normalization runs here yet/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refresh saved runs" }),
    ).toBeEnabled();
  });

  it("shows unreadable history without claiming it is empty or blocking current output", async () => {
    mocks.list.mockRejectedValue(new Error("unsupported owner record"));
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    expect(
      await screen.findByText(/Saved history is unavailable/),
    ).toBeVisible();
    expect(
      screen.queryByText(/No saved normalization runs here yet/),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    expect(
      await screen.findByRole("button", { name: "Download this run" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("heading", { name: "Result from this run" }),
    ).toBeVisible();
  });

  it("loads a new owner during an old save and prevents the old completion clearing a newer mutation", async () => {
    const aliceSave = deferred<void>(),
      bobSave = deferred<void>();
    mocks.list.mockResolvedValue([]);
    mocks.save.mockImplementation((snapshot) =>
      snapshot.ownerScope === "account:alice"
        ? aliceSave.promise
        : bobSave.promise,
    );
    const { result, rerender } = renderHook(
      ({ userId }) => useLearningEvidence(userId),
      { initialProps: { userId: "alice" } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      void result.current.save(record({ runId: "alice-run" }));
    });
    expect(result.current.busy).toBe(true);
    rerender({ userId: "bob" });
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith("account:bob", "normalize-data"),
    );
    expect(result.current.busy).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      void result.current.save(
        record({ ownerScope: "account:bob", runId: "bob-run" }),
      );
    });
    expect(result.current.mutation).toMatchObject({
      kind: "save",
      runId: "bob-run",
    });
    await act(async () => aliceSave.resolve());
    expect(result.current.busy).toBe(true);
    expect(result.current.mutation).toMatchObject({ runId: "bob-run" });
    await act(async () => bobSave.resolve());
    expect(result.current.busy).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("opens old results read-only, labels changed code, and restores only on request", async () => {
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText("Saved run: All checks passed");
    expect(screen.getByLabelText("Editor code")).toHaveValue("newer draft");
    expect(mocks.restore).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Saved run: All checks passed"));
    expect(screen.getByText(/Saved results from earlier code/)).toBeVisible();
    fireEvent.click(screen.getByText("Inspect saved code"));
    expect(screen.getByText("saved code")).toBeVisible();
    expect(mocks.restore).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Restore saved code" }));
    expect(mocks.restore).toHaveBeenCalledWith("saved code", false);
    expect(screen.getByLabelText("Editor code")).toHaveValue("saved code");
    expect(
      screen.queryByText(/Saved results from earlier code/),
    ).not.toBeInTheDocument();
  });

  it("keeps an earlier saved result when the latest run fails and storage rejects a save", async () => {
    mocks.create.mockResolvedValue(
      record({
        runId: "failed-run",
        submittedCode: "newer draft",
        runOutcome: "failed",
        checks: [
          { name: "Correct scale", passed: false, error: "Scale was zero" },
        ],
        artifacts: [],
      }),
    );
    mocks.save.mockRejectedValue(new Error("Quota exceeded"));
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText("Saved run: All checks passed");
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    await screen.findByText("Checks failed. This run is ready to save.");
    fireEvent.click(screen.getByRole("button", { name: "Save this run" }));
    await screen.findByText(/This browser could not save the run/);
    expect(
      screen.getByText("Saved run: All checks passed"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download this run" }),
    ).toBeEnabled();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "failed-run", runOutcome: "failed" }),
    );
  });

  it("shows partial checks, assistance, and a historical content label", async () => {
    mocks.list.mockResolvedValue([
      record({
        exerciseVersion: "older-version",
        runOutcome: "partial",
        assistance: {
          hintsRevealed: [1, 2],
          hintHistory: "session-only",
          solutionViewed: true,
        },
        checks: [
          {
            name: "Reusable statistics",
            passed: false,
            error: "Refitted the batch",
          },
        ],
      }),
    ]);
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    fireEvent.click(await screen.findByText("Saved run: Some checks failed"));
    expect(await screen.findByText(/Historical run/)).toBeVisible();
    expect(screen.getByText(/Solution viewed before this run/)).toBeVisible();
    expect(screen.getByText(/Earlier hint use is unknown/)).toBeVisible();
    fireEvent.click(screen.getByText("Checks and run details"));
    expect(screen.getByText("Refitted the batch")).toBeVisible();
    expect(screen.getByLabelText("Saved output")).not.toBeVisible();
    fireEvent.click(screen.getByText("All captured tables"));
    expect(
      within(screen.getByLabelText("Saved output")).getByText(
        /Captured output. Some checks failed/,
      ),
    ).toBeVisible();
  });

  it("clears the old owner's records immediately and ignores their late read", async () => {
    let resolveAlice!: (records: LearningEvidenceSnapshot[]) => void;
    mocks.list.mockImplementation((owner) =>
      owner === "account:alice"
        ? new Promise((resolve) => {
            resolveAlice = resolve;
          })
        : Promise.resolve([]),
    );
    const { rerender } = render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith(
        "account:alice",
        "normalize-data",
      ),
    );
    rerender(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="bob"
        content={content}
      />,
    );
    await screen.findByText(/No saved normalization runs here yet/);
    await act(async () => {
      resolveAlice([record()]);
    });
    expect(
      screen.queryByText("Saved run: All checks passed"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("saved code")).not.toBeInTheDocument();
  });

  it("discards a run whose snapshot finishes after an account switch", async () => {
    let resolveCapture!: (record: LearningEvidenceSnapshot) => void;
    mocks.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCapture = resolve;
        }),
    );
    mocks.list.mockResolvedValue([]);
    const { rerender } = render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText(/No saved normalization runs here yet/);
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    rerender(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="bob"
        content={content}
      />,
    );
    await act(async () => {
      resolveCapture(record());
    });
    expect(
      screen.queryByRole("button", { name: "Save this run" }),
    ).not.toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("does not let an older read overwrite a newly saved run", async () => {
    let resolveInitial!: (records: LearningEvidenceSnapshot[]) => void;
    const latest = record({
      runId: "latest-run",
      submittedCode: "newer draft",
    });
    mocks.list
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveInitial = resolve;
          }),
      )
      .mockResolvedValue([record(), latest]);
    mocks.create.mockResolvedValue(latest);
    render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await waitFor(() => expect(mocks.list).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Save this run" }),
    );
    await screen.findByText("Latest saved run: All checks passed");
    await act(async () => {
      resolveInitial([record()]);
    });
    expect(
      screen.getByText("Latest saved run: All checks passed"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run saved" })).toBeDisabled();
  });

  it("loads only the network milestone and clears normalization when the exercise changes", async () => {
    let resolveNormalization!: (records: LearningEvidenceSnapshot[]) => void;
    mocks.list.mockImplementation((_owner, slug) =>
      slug === "normalize-data"
        ? new Promise((resolve) => {
            resolveNormalization = resolve;
          })
        : Promise.resolve([networkRecord()]),
    );
    const { rerender } = render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith(
        "account:alice",
        "normalize-data",
      ),
    );
    rerender(
      <LearningEvidenceExercise
        slug="simple-network"
        draftOwner="alice"
        content={content}
      />,
    );
    expect(
      screen.queryByRole("region", { name: "Saved normalization runs" }),
    ).not.toBeInTheDocument();
    const network = await screen.findByRole("region", {
      name: "Saved network runs",
    });
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith(
        "account:alice",
        "simple-network",
      ),
    );
    fireEvent.click(
      await within(network).findByText("Saved run: All checks passed"),
    );
    fireEvent.click(within(network).getByText("Inspect saved code"));
    expect(within(network).getByText("saved network code")).toBeVisible();
    await act(async () => {
      resolveNormalization([record()]);
    });
    expect(screen.queryByText("saved code")).not.toBeInTheDocument();
    expect(within(network).getByText("saved network code")).toBeVisible();
  });

  it("discards a delayed normalization snapshot after opening the network exercise", async () => {
    let resolveCapture!: (record: LearningEvidenceSnapshot) => void;
    mocks.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCapture = resolve;
        }),
    );
    mocks.list.mockResolvedValue([]);
    const { rerender } = render(
      <LearningEvidenceExercise
        slug="normalize-data"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText(/No saved normalization runs here yet/);
    fireEvent.click(screen.getByRole("button", { name: "Run tests" }));
    rerender(
      <LearningEvidenceExercise
        slug="simple-network"
        draftOwner="alice"
        content={content}
      />,
    );
    await screen.findByText(/No saved network runs here yet/);
    await act(async () => {
      resolveCapture(record());
    });
    expect(
      screen.queryByRole("button", { name: "Save this run" }),
    ).not.toBeInTheDocument();
  });
});
