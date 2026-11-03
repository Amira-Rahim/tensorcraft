import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { ExerciseRunSnapshot } from "@tensorcraft/ui";
import { NormalizationRunExplanation } from "./normalization-run-explanation";

function captured(): ExerciseRunSnapshot["artifacts"] {
  return [
    {
      kind: "table",
      title: "Input readings",
      columns: ["Reading", "Temperature", "Signal strength"],
      rows: [
        [1, 101, 0.15],
        [2, 202, 0.45],
      ],
    },
    {
      kind: "table",
      title: "Saved training statistics",
      columns: ["Feature", "Mean", "Standard deviation"],
      rows: [
        ["Temperature", 150, 50],
        ["Signal strength", 0.3, 0.15],
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
        [1, 901, 902, 0.123],
        [2, 903, 904, 0.456],
      ],
    },
  ];
}

function value(label: string) {
  return screen.getByText(label, { selector: "dt" }).nextElementSibling;
}

describe("captured normalization explanation", () => {
  it("pairs selected inputs and outputs without replacing captured values with a calculation", () => {
    render(<NormalizationRunExplanation artifacts={captured()} complete />);
    expect(value("Input value")).toHaveTextContent("101");
    expect(value("Stored mean")).toHaveTextContent("150");
    expect(value("Captured scaled value")).toHaveTextContent("901");
    expect(screen.getByText("0.123", { selector: "strong" })).toBeVisible();

    fireEvent.change(screen.getByRole("combobox", { name: "Reading" }), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Feature" }), {
      target: { value: "1" },
    });
    expect(value("Input value")).toHaveTextContent("0.45");
    expect(value("Stored mean")).toHaveTextContent("0.3");
    expect(value("Stored standard deviation")).toHaveTextContent("0.15");
    expect(value("Captured scaled value")).toHaveTextContent("904");
    expect(screen.getByText("0.456", { selector: "strong" })).toBeVisible();
  });

  it("explains a zero stored scale and keeps partial results explicitly unverified", () => {
    const artifacts = captured();
    const statistics = artifacts[1];
    if (statistics?.kind !== "table")
      throw new Error("Missing test statistics");
    statistics.rows[0]![2] = 0;
    render(
      <NormalizationRunExplanation artifacts={artifacts} complete={false} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Some checks did not pass",
    );
    expect(value("Stored standard deviation")).toHaveTextContent("0");
    expect(value("Captured scaled value")).toHaveTextContent("901");
    expect(screen.getByText(/uses a divisor of 1/)).toBeVisible();
    expect(
      screen.getByText(/does not measure classifier accuracy/),
    ).toBeVisible();
  });

  it.each(["missing", "columns", "rows", "order", "duplicate"])(
    "omits the explanation for %s artifacts instead of guessing values",
    (failure) => {
      const artifacts = captured();
      const outputs = artifacts[2];
      if (outputs?.kind !== "table") throw new Error("Missing test output");
      if (failure === "missing") artifacts.pop();
      if (failure === "columns") outputs.columns.reverse();
      if (failure === "rows") outputs.rows[0]!.pop();
      if (failure === "order") outputs.rows.reverse();
      if (failure === "duplicate") artifacts.push(artifacts[0]!);
      const { container } = render(
        <NormalizationRunExplanation artifacts={artifacts} complete={false} />,
      );
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("keeps native controls labeled and the full explanation accessible", async () => {
    const { container } = render(
      <NormalizationRunExplanation artifacts={captured()} complete />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
