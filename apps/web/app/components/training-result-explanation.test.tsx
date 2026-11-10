import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { readLessonResultExplanation } from "@/lib/lesson-result-explanations";
import { LessonResultExplanation } from "./lesson-result-explanation";
import {
  historyArtifacts,
  lossArtifacts,
  scalarArtifacts,
} from "./__fixtures__/lesson-results";
import type { ExerciseArtifact } from "@tensorcraft/ui";

const value = (label: string) =>
  screen.getByText(label, { selector: "dt" }).nextElementSibling;
function view(
  slug: string,
  artifacts: ExerciseArtifact[],
  complete = true,
  stale = false,
) {
  const result = readLessonResultExplanation(slug, artifacts);
  if (!result) throw Error("Expected a valid presentation fixture");
  return render(
    <LessonResultExplanation
      result={result}
      artifacts={artifacts}
      complete={complete}
      stale={stale}
    />,
  );
}

describe("training captured-result explanations", () => {
  it("traces an MSE row and a wrong BCE scalar without replacing it", async () => {
    const artifacts = lossArtifacts();
    const comparison = artifacts[1]!;
    if (comparison.kind !== "table") throw Error("Expected comparison");
    comparison.rows[1]![1] = 0;
    const { container } = view("mse-loss", artifacts, false, true);
    fireEvent.change(screen.getByLabelText("Batch position"), {
      target: { value: "1" },
    });
    expect(value("Captured label")).toHaveTextContent("-0.5");
    expect(value("Squared difference")).toHaveTextContent("0.25");
    expect(value("JavaScript batch reference")).toHaveTextContent("0.15");
    fireEvent.change(screen.getByLabelText("Loss probe"), {
      target: { value: "bce" },
    });
    expect(screen.getByLabelText("Batch position")).toHaveValue("0");
    fireEvent.change(screen.getByLabelText("Confidence case"), {
      target: { value: "1" },
    });
    expect(value("Captured logit")).toHaveTextContent("-3");
    expect(value("Your returned batch cross-entropy")).toHaveTextContent("0");
    expect(value("JavaScript batch reference")).toHaveTextContent("3.048587");
    expect(screen.getByText(/The editor has changed/)).toBeVisible();
    expect(
      screen.getByText(/Your code has changed. Run it again/),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps finite learner outputs readable when a reference overflows", () => {
    const artifacts = lossArtifacts();
    const mse = artifacts[0]!;
    if (mse.kind !== "table") throw Error("Expected MSE");
    mse.rows[0]![2] = Number.MAX_VALUE;
    view("mse-loss", artifacts, false);
    expect(value("Squared difference")).toHaveTextContent(
      "Outside JavaScript’s finite number range",
    );
    expect(value("Your returned batch MSE")).toHaveTextContent("0.15");
  });

  it("follows captured second and third updates without inventing an initial operand", async () => {
    const { container } = view("gradient-step", scalarArtifacts());
    expect(value("Weight before this update")).toHaveTextContent("4");
    expect(value("Gradient times learning rate")).toHaveTextContent("0.8");
    expect(value("Your weight after this update")).toHaveTextContent("3.2");
    fireEvent.change(screen.getByLabelText("Captured update"), {
      target: { value: "1" },
    });
    expect(value("Weight before this update")).toHaveTextContent("3.2");
    expect(value("Your loss after this update")).toHaveTextContent("6.5536");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses full-window means independently of sampled epoch selection and preserves a failed diagnosis", async () => {
    const artifacts = historyArtifacts(500);
    const table = artifacts[1]!;
    if (table.kind !== "table") throw Error("Expected diagnosis");
    table.rows[9]![1] = "threw";
    table.rows[10]![1] = null;
    table.rows[11]![1] = "Example thrown diagnostic error";
    const { container } = view("training-loop-exercise", artifacts, false);
    expect(
      screen.getByLabelText("Captured sample epoch").querySelectorAll("option"),
    ).toHaveLength(64);
    expect(value("Previous ten-epoch window")).toHaveTextContent("481 to 490");
    expect(value("Recent ten-epoch window")).toHaveTextContent("491 to 500");
    expect(
      value("Reference from the captured full-window means"),
    ).toHaveTextContent("train-down-validation-up");
    expect(value("Your returned diagnosis")).toHaveTextContent(
      "No valid label returned",
    );
    fireEvent.change(screen.getByLabelText("Captured sample epoch"), {
      target: { value: "63" },
    });
    expect(value("Captured validation loss")).toHaveTextContent("1.2");
    expect(
      screen.getByText(/Epoch 500: This epoch belongs to the recent window/),
    ).toBeVisible();
    expect(value("Validation previous mean")).toHaveTextContent("1");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("explains a valid short budget without fabricating diagnosis windows", () => {
    view("training-loop-exercise", historyArtifacts(5));
    expect(value("Your returned diagnosis")).toHaveTextContent(
      "insufficient-history",
    );
    expect(
      screen.queryByText("Previous ten-epoch window"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /A shorter requested training budget can still be valid/,
      ),
    ).toBeVisible();
  });

  it("explains rounded means when full precision crosses the strict boundary", () => {
    const artifacts = historyArtifacts();
    const table = artifacts[1]!;
    if (table.kind !== "table") throw Error("Expected diagnosis");
    table.rows[8]![1] = 1.050000071525574;
    view("training-loop-exercise", artifacts, false);
    expect(value("Validation recent mean")).toHaveTextContent("1.05");
    expect(value("Validation trend reference")).toHaveTextContent("up");
    expect(screen.getByText(/Displayed means are rounded/)).toBeVisible();
  });
});
