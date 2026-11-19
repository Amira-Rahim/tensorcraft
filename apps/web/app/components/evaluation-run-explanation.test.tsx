import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import {
  EVALUATION_CONTEXT_KEYS,
  EVALUATION_FIXTURE,
  EVALUATION_ROLES,
  type EvaluationContextKey,
  type EvaluationRole,
} from "@tensorcraft/shared";
import type { ExerciseArtifact } from "@tensorcraft/ui";
import { EvaluationRunExplanation } from "./evaluation-run-explanation";
import { hasInspectableResult, ResultExplanation } from "./result-explanation";

type Table = Extract<ExerciseArtifact, { kind: "table" }>;
type Cell = Table["rows"][number][number];
const table = (role: EvaluationRole, rows: Cell[][]): Table => ({
  kind: "table",
  title: role.title,
  columns: [...role.columns],
  rows,
});

function captured(errors = true): Table[] {
  const values: Record<EvaluationContextKey, Cell> = {
    definitionId: "deep-orbit.evaluation-cases",
    contractVersion: 1,
    fixtureId: "deep-scan-evaluation-100-43",
    fixtureVersion: "1",
    captureStatus: "complete",
    evaluationSourceStatus: "matched",
    trainingSourceStatus: "matched",
    fitHistoryStatus: "matched",
    recordingStatus: "complete",
    trainingLogStatus: "available",
    modelStateStatus: "matched",
    modelSupportStatus: "supported",
    measurementStatus: "consistent",
    submittedEvaluationStatus: "matched",
    observedFitCount: 1,
    modelFitCount: 1,
    trainingRows: 100,
    evaluationRows: 43,
    requestedEpochs: 30,
    completedEpochs: 30,
    batchSize: 16,
    shuffle: true,
    initialEpoch: 0,
    validationSplit: 0,
    parameterCount: 673,
    inputWidth: 3,
    layer1: 32,
    layer2: 16,
    layer3: 1,
    optimizer: "Adam",
    loss: "binaryCrossentropy",
    metric: "binaryAccuracy",
    decisionRule: 0.5,
    class0: 0,
    class1: 1,
    learnerDiagnosis: "no-gap-warning",
    callbacksPresent: false,
    evaluationBatchSize: 32,
  };
  const details: Partial<Record<EvaluationContextKey, Cell>> = {
    layer1: "relu",
    layer2: "relu",
    layer3: "sigmoid",
    optimizer: 0.001,
    metric: "accuracy",
    decisionRule: "gt",
    class0: "calm",
    class1: "flagged",
    learnerDiagnosis: "present",
  };
  const rows = EVALUATION_FIXTURE.evaluation.map(([id, f1, f2, f3, label]) => [
    id,
    id < 40 ? "generated" : "authored",
    f1,
    f2,
    f3,
    label,
    errors && id === 0 ? 0.7 : errors && id === 40 ? 0.4 : label ? 0.8 : 0.2,
  ]);
  return [
    table(EVALUATION_ROLES.measuredScores, [
      ["Final training log", 100, 0.2, 0.9],
      ["Final model evaluation", 43, 0.2, (errors ? 41 : 43) / 43],
    ]),
    table(
      EVALUATION_ROLES.runContext,
      EVALUATION_CONTEXT_KEYS.map((key) => [
        key,
        values[key],
        details[key] ?? null,
      ]),
    ),
    table(EVALUATION_ROLES.generatedCases, rows.slice(0, 40)),
    table(EVALUATION_ROLES.authoredCases, rows.slice(40)),
  ];
}
function context(
  rows: Table[],
  key: EvaluationContextKey,
  value: Cell,
  detail: Cell = null,
) {
  rows[1].rows[EVALUATION_CONTEXT_KEYS.indexOf(key)] = [key, value, detail];
}
const selection = () =>
  screen.getByRole("combobox", { name: "Case to inspect" });
const filter = (name: string) =>
  within(screen.getByRole("group", { name: "Cases to inspect" })).getByRole(
    "button",
    { name },
  );
const plot = () =>
  screen.getByRole("group", { name: "Captured scores by supplied label" });
const point = (id: number) => plot().querySelector(`[data-case-id="${id}"]`)!;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("evaluation result inspection", () => {
  it("keeps every point visible while filters and native navigation select stable IDs", () => {
    render(<EvaluationRunExplanation artifacts={captured()} complete />);
    expect(selection()).toHaveValue("0");
    expect(
      screen.getByText(/41 of 43 cases classified correctly/),
    ).toBeVisible();
    const firstX = point(0)
      .querySelector("[data-score-mark]")!
      .getAttribute("cx");
    const y = (id: number) =>
      point(id).querySelector("[data-score-mark]")!.getAttribute("cy");
    expect(y(0)).toBe(y(1));
    expect(y(2)).not.toBe(y(1));
    fireEvent.click(filter("Missed anomalies"));
    expect(selection()).toHaveValue("40");
    expect(plot().querySelectorAll("[data-case-id]")).toHaveLength(43);
    expect(point(0)).toHaveAttribute("data-highlighted", "false");
    expect(point(0).querySelector("[data-score-mark]")).toHaveAttribute(
      "cx",
      firstX,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 of 43 available cases highlighted. Inspecting case 40.",
    );
    fireEvent.click(filter("All cases"));
    expect(selection()).toHaveValue("40");
    fireEvent.click(screen.getByRole("button", { name: "Next case" }));
    expect(selection()).toHaveValue("41");
    fireEvent.click(screen.getByRole("button", { name: "Previous case" }));
    expect(selection()).toHaveValue("40");
    fireEvent.change(selection(), { target: { value: "42" } });
    expect(screen.getByRole("heading", { name: "Case 42" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next case" })).toBeDisabled();
    expect(
      [...plot().querySelectorAll("[data-case-id]")].every(
        (p) => p.getAttribute("tabindex") === "-1",
      ),
    ).toBe(true);
  });

  it("returns to all cases when a muted point outside the category is selected", () => {
    render(<EvaluationRunExplanation artifacts={captured()} complete />);
    fireEvent.click(filter("Missed anomalies"));
    fireEvent.click(point(20));
    expect(filter("All cases")).toHaveAttribute("aria-pressed", "true");
    expect(selection()).toHaveValue("20");
    fireEvent.keyDown(point(0), { key: "Enter" });
    expect(selection()).toHaveValue("0");
  });

  it("shows an honest empty category for a valid zero-error run", () => {
    render(<EvaluationRunExplanation artifacts={captured(false)} complete />);
    expect(
      screen.getByText(/43 of 43 cases classified correctly/),
    ).toBeVisible();
    fireEvent.click(filter("Missed anomalies"));
    expect(selection()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Previous case" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next case" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "No missed anomalies in these 43 available cases",
    );
    expect(plot().querySelectorAll("[data-case-id]")).toHaveLength(43);
    expect(
      screen.queryByRole("heading", { name: /^Case \d/ }),
    ).not.toBeInTheDocument();
  });

  it("uses full precision at the strict boundary even when the grader failed", () => {
    const rows = captured(false);
    rows[2].rows[0][6] = 0.5;
    rows[2].rows[20][6] = 0.5000000000000001;
    context(rows, "learnerDiagnosis", "large-gap", "present");
    render(<EvaluationRunExplanation artifacts={rows} complete={false} />);
    expect(screen.getByText(/diagnosis check is incorrect/)).toBeVisible();
    expect(screen.getByText(/It equals 0.5/)).toHaveTextContent(
      "predicts calm (0)",
    );
    fireEvent.change(selection(), { target: { value: "20" } });
    expect(
      screen.getByText("0.5000000000000001", { selector: "strong" }),
    ).toBeVisible();
    expect(screen.getByText(/It exceeds 0.5/)).toHaveTextContent(
      "predicts flagged (1)",
    );
  });

  it("withholds whole-run totals for partial and inconsistent records", () => {
    const partial = captured();
    partial.pop();
    context(partial, "captureStatus", "partial", "missing-cases");
    context(partial, "measurementStatus", "unknown", "missing-cases");
    const { rerender } = render(
      <EvaluationRunExplanation artifacts={partial} complete={false} />,
    );
    expect(
      screen.getByText(/40 of 43 case records available/),
    ).toHaveTextContent("Whole-run accuracy and totals are unavailable");
    expect(
      screen.queryByText(/cases classified correctly/),
    ).not.toBeInTheDocument();
    expect(plot().querySelectorAll("[data-case-id]")).toHaveLength(40);
    const inconsistent = captured();
    inconsistent[0].rows[1][3] = 0.5;
    rerender(<EvaluationRunExplanation artifacts={inconsistent} complete />);
    expect(screen.getByText(/recorded accuracy disagree/)).toBeVisible();
    expect(
      screen.queryByText(/cases classified correctly/),
    ).not.toBeInTheDocument();
    expect(selection()).toHaveValue("0");
  });

  it("uses numeric labels and input positions for unverified sources", () => {
    const rows = captured();
    rows[2].rows[0][1] = "unknown";
    rows[2].rows[0][2] = 0.123456789;
    context(rows, "evaluationSourceStatus", "mismatch", "feature-mismatch");
    render(<EvaluationRunExplanation artifacts={rows} complete />);
    expect(
      screen.getByRole("heading", { name: "Input position 0" }),
    ).toBeVisible();
    expect(screen.getByText("Input 1", { selector: "dt" })).toBeVisible();
    expect(screen.getByText("0.123456789", { selector: "dd" })).toBeVisible();
    expect(
      point(0).querySelector("[data-score-mark]")!.tagName.toLowerCase(),
    ).toBe("path");
    expect(
      screen.getByText("Supplied label 0", { selector: "text" }),
    ).toBeVisible();
    expect(screen.getByText(/It exceeds 0.5/)).toHaveTextContent(
      "predicts 1. The supplied label is 0.",
    );
    expect(filter("Label 1 predicted 0")).toBeVisible();
    expect(
      screen.getByText(/Their source and meaning are unverified/),
    ).toBeVisible();
    expect(
      screen.queryByText(/These dimensionless inputs/),
    ).not.toBeInTheDocument();
  });

  it("restarts selection for a new capture and preserves exact x on resize", () => {
    let resized: ResizeObserverCallback | undefined;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resized = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    let width = 640;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({
        width,
        height: 200,
        top: 0,
        left: 0,
        right: width,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON() {},
      }),
    );
    const { rerender } = render(
      <EvaluationRunExplanation artifacts={captured()} complete />,
    );
    fireEvent.click(filter("Missed anomalies"));
    width = 320;
    act(() => resized?.([], {} as ResizeObserver));
    expect(point(0).querySelector("[data-score-mark]")).toHaveAttribute(
      "cx",
      String(16 + 0.7 * 288),
    );
    const next = captured(false);
    rerender(<EvaluationRunExplanation artifacts={next} complete />);
    expect(filter("All cases")).toHaveAttribute("aria-pressed", "true");
    expect(selection()).toHaveValue("0");
    vi.unstubAllGlobals();
  });

  it("keeps labeled native controls and meaningful SVG alternatives accessible", async () => {
    const { container } = render(
      <EvaluationRunExplanation artifacts={captured()} complete />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("shared result dispatch", () => {
  it("uses validated output independently of the grader verdict", () => {
    expect(hasInspectableResult("deep-scan-eval", captured())).toBe(true);
    const { rerender } = render(
      <ResultExplanation
        exerciseSlug="deep-scan-eval"
        artifacts={captured()}
        complete={false}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "The cases behind this evaluation" }),
    ).toBeVisible();
    const malformed = captured();
    malformed[2].columns.reverse();
    expect(hasInspectableResult("deep-scan-eval", malformed)).toBe(false);
    rerender(
      <ResultExplanation
        exerciseSlug="deep-scan-eval"
        artifacts={malformed}
        complete
      />,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(hasInspectableResult("unknown-exercise", captured())).toBe(false);
  });

  it("reuses normalization and network parsers without guessing from unrelated artifacts", () => {
    const normalization: ExerciseArtifact[] = [
      {
        kind: "table",
        title: "Input readings",
        columns: ["Reading", "Temperature", "Signal strength"],
        rows: [[1, 10, 0.2]],
      },
      {
        kind: "table",
        title: "Saved training statistics",
        columns: ["Feature", "Mean", "Standard deviation"],
        rows: [
          ["Temperature", 10, 1],
          ["Signal strength", 0.2, 1],
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
        rows: [[1, 0, 0, 0.4]],
      },
    ];
    expect(hasInspectableResult("normalize-data", normalization)).toBe(true);
    expect(
      hasInspectableResult("normalize-data", normalization.slice(0, 1)),
    ).toBe(false);
    const settings: ExerciseArtifact[] = [
      {
        kind: "table",
        title: "Training settings from this run",
        columns: ["Setting", "Value"],
        rows: [["Parameters", 529]],
      },
    ];
    expect(hasInspectableResult("simple-network", settings)).toBe(true);
    expect(hasInspectableResult("simple-network", [])).toBe(false);
    expect(hasInspectableResult("simple-network", captured())).toBe(false);
  });
});
