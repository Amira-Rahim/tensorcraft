import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExerciseProps, ExerciseRunSnapshot } from "@tensorcraft/ui";
import type { LearningEvidenceSnapshot } from "@/lib/learning-evidence-types";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
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
}));
vi.mock("@tensorcraft/ui", async () => {
  const { useState } = await import("react");
  return {
    Exercise: (props: ExerciseProps) => {
      const [code, setCode] = useState("newer draft");
      return (
        <>
          <input
            aria-label="Editor code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={() => props.onRunSnapshot?.(mocks.run!)}>
            Run tests
          </button>
          {props.renderSavedRuns?.({
            currentCode: code,
            restore: (source, solutionViewed) => {
              mocks.restore(source, solutionViewed);
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

describe("saved normalization runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
