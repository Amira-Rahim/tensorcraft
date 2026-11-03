import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ExerciseArtifact } from "@tensorcraft/ui";
import { NetworkRunExplanation } from "./network-run-explanation";

const ids = [
  ...Array.from({ length: 8 }, (_, i) => i),
  ...Array.from({ length: 8 }, (_, i) => i + 60),
];
const features = [
  "Amplitude proxy",
  "Zero-crossing proxy",
  "Phase proxy",
  "Practice feature 4",
  "Practice feature 5",
  "Practice feature 6",
  "Practice feature 7",
  "Practice feature 8",
];
function artifacts(): ExerciseArtifact[] {
  return [
    {
      kind: "table",
      title: "Selected training readings",
      columns: ["Row ID", "Label", ...features],
      rows: ids.map((id) => [
        id,
        id < 60 ? 0 : 1,
        ...Array.from({ length: 8 }, (_, i) => (id + i) / 100),
      ]),
    },
    {
      kind: "table",
      title: "Scores from your before-and-after run",
      columns: [
        "Row ID",
        "Label",
        "First model before training",
        "Second model untrained",
        "First model after training",
      ],
      rows: ids.map((id) => [
        id,
        id < 60 ? 0 : 1,
        0.42,
        0.37,
        id < 60 ? 0.3 : 0.12,
      ]),
    },
    {
      kind: "table",
      title: "Training settings from this run",
      columns: ["Setting", "Value"],
      rows: [
        ["Parameters", 529],
        ["Layer units", "24, 12, 1"],
        ["Activations", "relu, relu, sigmoid"],
        ["Optimizer", "Adam"],
        ["Learning rate", 0.001],
        ["Loss", "binaryCrossentropy"],
        ["Metrics", "accuracy"],
        ["Requested epochs", 50],
        ["Completed epochs", 50],
        ["Batch size", 16],
        ["Shuffle", true],
        ["Initial epoch", 0],
        ["Validation split", 0],
        ["Rows passed to fit", 120],
        ["Fits on first model", 1],
      ],
    },
    {
      kind: "series",
      title: "Training loss from this run",
      xLabel: "Epoch",
      yLabel: "Binary crossentropy",
      labels: ["1", "25", "50"],
      series: [{ name: "Loss", values: [0.7, 0.8, 0.9] }],
    },
  ];
}

describe("captured network explanation", () => {
  it("compares the same captured row and retains weak training results", () => {
    render(<NetworkRunExplanation artifacts={artifacts()} complete />);
    expect(screen.getByText(/Row 0 has label 0/)).toBeVisible();
    fireEvent.change(screen.getByRole("combobox", { name: "Training row" }), {
      target: { value: "8" },
    });
    expect(screen.getByText(/Row 60 has label 1/)).toBeVisible();
    expect(
      within(
        screen.getByText("First model after training").parentElement!,
      ).getByText("0.12"),
    ).toBeVisible();
    expect(
      within(
        screen.getByText("First model before training").parentElement!,
      ).getByText("0.42"),
    ).toBeVisible();
    expect(
      screen.getByText(/do not measure performance on new data/),
    ).toBeVisible();
    const settings = screen.getByRole("region", {
      name: "Captured training settings",
    });
    expect(within(settings).getByText("Rows passed to fit")).toBeVisible();
    expect(within(settings).getByText("120")).toBeVisible();
    fireEvent.click(screen.getByText("Selected input values"));
    expect(
      within(screen.getByText("Amplitude proxy").parentElement!).getByText(
        "0.6",
      ),
    ).toBeVisible();
    const loss = screen.getByRole("region", { name: "Captured training loss" });
    fireEvent.click(within(loss).getByText("Read the values"));
    expect(within(loss).getByRole("cell", { name: "0.9" })).toBeVisible();
    expect(
      screen.queryByText(/improved|accuracy increased/i),
    ).not.toBeInTheDocument();
  });

  it("keeps valid settings and loss when the before-and-after input order differs", () => {
    const captured = artifacts();
    if (captured[0].kind === "table") captured[0].rows.reverse();
    render(<NetworkRunExplanation artifacts={captured} complete={false} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.getByText(/did not capture matching input rows/),
    ).toBeVisible();
    expect(screen.getByText(/Some checks did not pass/)).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Captured training settings" }),
    ).toContainElement(screen.getByText("529"));
    expect(
      screen.getByRole("region", { name: "Captured training loss" }),
    ).toBeVisible();
  });

  it.each(["label", "duplicate", "range", "missing", "nonfinite"])(
    "does not invent a comparison for %s data",
    (kind) => {
      const captured = artifacts();
      if (captured[1].kind !== "table") throw new Error("fixture");
      if (kind === "label") captured[1].rows[0][1] = 1;
      if (kind === "duplicate") captured.push(captured[1]);
      if (kind === "range") captured[1].rows[0][4] = 1.2;
      if (kind === "nonfinite") captured[1].rows[0][4] = NaN;
      if (kind === "missing") captured.shift();
      render(<NetworkRunExplanation artifacts={captured} complete={false} />);
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        screen.getByText(/did not capture matching input rows/),
      ).toBeVisible();
    },
  );

  it("does not reinterpret a wrong-loss run as binary crossentropy", () => {
    const captured = artifacts();
    if (captured[3].kind !== "series") throw new Error("fixture");
    captured[3].yLabel = "Training loss";
    captured[3].series[0].values = [-1, -2, -3];
    render(<NetworkRunExplanation artifacts={captured} complete={false} />);
    const loss = screen.getByRole("region", { name: "Captured training loss" });
    expect(loss).not.toHaveTextContent("Binary crossentropy");
    fireEvent.click(within(loss).getByText("Read the values"));
    expect(within(loss).getByRole("cell", { name: "-3" })).toBeVisible();
  });

  it("omits a malformed history and reports missing settings", () => {
    const captured = artifacts().slice(0, 2);
    captured.push({
      kind: "series",
      title: "Training loss from this run",
      xLabel: "Epoch",
      yLabel: "Binary crossentropy",
      labels: ["2", "1"],
      series: [{ name: "Loss", values: [0.7, 0.6] }],
    });
    render(<NetworkRunExplanation artifacts={captured} complete={false} />);
    expect(
      screen.queryByRole("region", { name: "Captured training loss" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no usable training loss history/)).toBeVisible();
    expect(screen.getByText(/no usable training settings/)).toBeVisible();
  });
});
