import { afterEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  BriefingInvestigationVisual,
  LessonInvestigation,
} from "./lesson-investigation";
import type { LessonInvestigationSpec } from "./investigation-types";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";

const spec: LessonInvestigationSpec = {
  title: "Check the total",
  brief: "Change the input and see how the total changes.",
  boundary: "This example adds two readings. It does not train a model.",
  controls: [
    {
      id: "reading",
      label: "First reading",
      kind: "range",
      initial: 2,
      min: 0,
      max: 10,
    },
    {
      id: "operation",
      label: "Operation",
      kind: "choice",
      initial: 0,
      options: [
        { value: 0, label: "Add" },
        { value: 1, label: "Multiply" },
      ],
    },
  ],
  cases: [
    {
      id: "small",
      label: "Small readings",
      description: "Start with a small reading.",
    },
    {
      id: "large",
      label: "Large readings",
      description: "Try a larger reading.",
      values: { reading: 6 },
    },
  ],
  prediction: { prompt: "What total do you expect?", tolerance: 0.01 },
  evaluate(values) {
    const total =
      values.operation === 1 ? values.reading! * 3 : values.reading! + 3;
    return {
      answer: total,
      answerLabel: "Observed total",
      explanation: `The ${values.operation === 1 ? "product" : "sum"} is ${total}.`,
      graphics: [
        {
          kind: "cells",
          label: "Input readings",
          values: [values.reading!, 3],
          columns: 2,
        },
        {
          kind: "bars",
          label: "Output total",
          values: [total],
          labels: ["Total"],
        },
      ],
      code: `const total = ${values.reading} ${values.operation === 1 ? "*" : "+"} 3;`,
    };
  },
};

afterEach(cleanup);

describe("the lesson investigation", () => {
  it("cannot submit a native form before its client handlers are ready", () => {
    const html = renderToString(
      <LessonInvestigation spec={spec} lessonSlug="test-lesson" />,
    );
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(
      document.querySelector('button[type="submit"]')?.matches(":disabled"),
    ).toBe(true);
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    const run = screen.getByRole("button", { name: "Run experiment" });
    expect(run).toBeEnabled();
    fireEvent.click(run);
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Observed total: 5");
  });
  it("labels the loss slider and prediction textbox separately", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["loss-functions"]!}
        lessonSlug="loss-functions"
      />,
    );
    const slider = screen.getByRole("slider", {
      name: "Change to first prediction or logit",
    });
    const answer = screen.getByRole("textbox", {
      name: "What scalar loss does this calculation return for the whole batch?",
    });
    expect(slider.id).not.toBe(answer.id);
    fireEvent.change(answer, { target: { value: "0.333" } });
    expect(slider).toHaveValue("0");
    expect(answer).toHaveValue("0.333");
  });
  it("updates dependent range limits and clamps a previously selected batch", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["data-loading"]!}
        lessonSlug="data-loading"
      />,
    );
    const size = screen.getByLabelText("Rows per batch");
    const batch = screen.getByRole("slider", {
      name: "Batch index",
    });
    expect(batch).toHaveAttribute("max", "3");
    fireEvent.change(size, { target: { value: "2" } });
    expect(batch).toHaveAttribute("max", "7");
    fireEvent.change(batch, { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("First row ID in the batch: 14");
    fireEvent.change(size, { target: { value: "8" } });
    expect(batch).toHaveAttribute("max", "1");
    expect(batch).toHaveValue("1");
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("First row ID in the batch: 8");
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "changed" },
    });
    expect(batch).toHaveAttribute("max", "7");
    expect(batch).toHaveValue("2");
  });
  it("keeps a native range edit and its calculation aligned after the range shrinks and expands", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["tensor-operations"]!}
        lessonSlug="tensor-operations"
      />,
    );
    const stage = screen.getByLabelText("Calculation");
    const column = screen.getByRole("slider", { name: "Output column index" });
    const row = screen.getByRole("slider", { name: "Output row index" });
    const setNativeValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    const input = (slider: HTMLElement, value: string) => {
      // Keyboard and pointer edits change the browser value before input fires.
      setNativeValue.call(slider, value);
      fireEvent.input(slider);
    };
    fireEvent.change(stage, { target: { value: "1" } });
    input(row, "1");
    input(column, "2");
    // Chromium can silently clamp the native value as max decreases. JSDOM
    // does not reproduce that update order, so emulate its native-only edit
    // before React applies the new limit and the matching controlled value.
    setNativeValue.call(column, "1");
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "changed" },
    });
    expect(column).toHaveAttribute("max", "1");
    expect(column).toHaveValue("1");
    fireEvent.change(stage, { target: { value: "1" } });
    expect(column).toHaveAttribute("max", "2");
    column.focus();
    input(column, "2");
    expect(column).toHaveFocus();
    expect(column).toHaveValue("2");
    const control = column.closest(".orbit-investigation-control")!;
    expect(control.querySelector("output")).toHaveTextContent("2");
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "What value will the selected output row and column contain?",
      }),
      { target: { value: "21.5" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Correct prediction.");
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Row 1, Bank 2: 21.5");
  });

  it("shows inputs before running and checks a prediction against the observed result", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    expect(
      screen.getByRole("list", { name: "Input readings" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Output total" }),
    ).not.toBeInTheDocument();
    // Learners inspect the current inputs before making a prediction or running.
    const inputReadings = screen.getByRole("list", { name: "Input readings" });
    const prediction = screen.getByLabelText("What total do you expect?");
    const runButton = screen.getByRole("button", { name: "Run experiment" });
    expect(
      inputReadings.compareDocumentPosition(prediction) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      prediction.compareDocumentPosition(runButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("What total do you expect?"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Observed total: 5");
    expect(
      screen.getByRole("img", { name: "Output total" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset experiment" }),
    ).toBeInTheDocument();
  });

  it("keeps the previous result while inputs change and compares two saved runs", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    fireEvent.change(screen.getByLabelText("First reading"), {
      target: { value: "8" },
    });
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Inputs changed. Run again");
    const staleRun = screen.getByRole("region", {
      name: "Last run (inputs changed)",
    });
    expect(staleRun).toHaveTextContent("The sum is 5.");
    expect(staleRun).not.toHaveTextContent("The sum is 11.");
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Observed total: 11");
    fireEvent.click(
      screen.getByRole("button", { name: "Compare with previous run" }),
    );
    expect(
      screen.getByRole("button", { name: "Compare with previous run" }),
    ).toHaveAttribute("aria-pressed", "true");
    const previous = screen.getByRole("region", { name: "Previous run" });
    const latest = screen.getByRole("region", { name: "Latest run" });
    expect(previous).toHaveTextContent("The sum is 5.");
    expect(latest).toHaveTextContent("The sum is 11.");
    // A shared chart domain keeps the two totals visually comparable.
    const priorBar = within(previous)
      .getByRole("img", { name: "Output total" })
      .querySelector<HTMLElement>(".orbit-investigation-bar-fill")!;
    const latestBar = within(latest)
      .getByRole("img", { name: "Output total" })
      .querySelector<HTMLElement>(".orbit-investigation-bar-fill")!;
    expect(Number.parseFloat(priorBar.style.width)).toBeLessThan(
      Number.parseFloat(latestBar.style.width),
    );
    const priorText = within(previous).getByRole("img", {
      name: "Output total",
    }).textContent;
    const latestText = within(latest).getByRole("img", {
      name: "Output total",
    }).textContent;
    expect(priorText).toContain("11");
    expect(latestText).toContain("11");
  });

  it("keeps supplied evaluation scores separate from cutoff and baseline accuracy", () => {
    render(
      <BriefingInvestigationVisual
        spec={NUMERIC_INVESTIGATIONS["evaluating-deep-scan"]!}
      />,
    );
    const scores = screen.getByRole("img", {
      name: "Scores with reviewed labels",
    });
    const accuracy = screen.getByRole("img", {
      name: "Accuracy against a declared constant rule",
    });
    expect(scores).toHaveAttribute("data-domain-high", "0.91");
    expect(accuracy).toHaveAttribute("data-domain-high", "0.75");
    expect(
      Array.from(
        accuracy.querySelectorAll(".orbit-investigation-bar-label"),
        (label) => label.textContent,
      ),
    ).toEqual(["Selected cutoff", "Always predict 0"]);
    expect(
      scores.querySelectorAll(".orbit-investigation-bar-label"),
    ).toHaveLength(12);
  });

  it("does not share raw, z-score and min-max output axes when comparing normalization methods", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS.normalization!}
        lessonSlug="normalization"
      />,
    );
    const method = screen.getByLabelText("Scaling rule");
    const run = screen.getByRole("button", { name: "Run experiment" });
    fireEvent.change(method, { target: { value: "0" } });
    fireEvent.click(run);
    fireEvent.change(method, { target: { value: "1" } });
    fireEvent.click(run);
    fireEvent.click(
      screen.getByRole("button", { name: "Compare with previous run" }),
    );
    const output = (name: string) =>
      within(screen.getByRole("region", { name })).getByRole("img", {
        name: "New row after scaling",
      });
    expect(output("Previous run")).toHaveAttribute("data-domain-high", "24");
    expect(output("Latest run")).toHaveAttribute("data-domain-high", "0.447");
    fireEvent.change(method, { target: { value: "2" } });
    fireEvent.click(run);
    expect(output("Previous run")).toHaveAttribute("data-domain-high", "0.447");
    expect(output("Latest run")).toHaveAttribute("data-domain-high", "0.667");
  });

  it("aligns training and validation loss without relying on matching titles", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["training-loop"]!}
        lessonSlug="training-loop"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("img", { name: "Observed validation loss by epoch" }),
    ).toHaveAttribute("data-domain-high", "20");
    expect(
      screen.getByRole("img", { name: "Training loss by epoch" }),
    ).toHaveAttribute("data-domain-high", "20");
  });

  it("compares the controlled rollout and replay with arrived observations", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS.forecasting!}
        lessonSlug="forecasting"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    const observed = screen.getByRole("img", {
      name: "Arrived observations",
    });
    const forecast = screen.getByRole("img", {
      name: "Rollout predictions",
    });
    const replay = screen.getByRole("img", {
      name: "One-step replay predictions",
    });
    expect(observed.getAttribute("data-domain-high")).toBe(
      forecast.getAttribute("data-domain-high"),
    );
    expect(replay.getAttribute("data-domain-high")).toBe(
      forecast.getAttribute("data-domain-high"),
    );
    expect(
      screen.getByText("Windows before the selected prediction"),
    ).toBeInTheDocument();
  });

  it("compares equivalent evaluation graphs across runs without mixing scores and counts", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["evaluating-deep-scan"]!}
        lessonSlug="evaluating-deep-scan"
      />,
    );
    const scores = () =>
      screen.getByRole("img", { name: "Scores with reviewed labels" });
    expect(scores()).toHaveAttribute("data-domain-high", "0.91");
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(scores()).toHaveAttribute("data-domain-high", "0.91");
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(scores()).toHaveAttribute("data-domain-high", "0.76");
    fireEvent.click(
      screen.getByRole("button", { name: "Compare with previous run" }),
    );
    expect(scores()).toHaveAttribute("data-domain-high", "0.91");
    for (const name of ["Previous run", "Latest run"]) {
      const counts = within(screen.getByRole("region", { name })).getByRole(
        "img",
        {
          name: "Correct predictions, false alarms and misses",
        },
      );
      expect(counts).toHaveAttribute("data-domain-high", "5");
    }
  });

  it("links the selected diagnostic row and clamps it when the binary contract changes", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["loss-functions"]!}
        lessonSlug="loss-functions"
      />,
    );
    const row = screen.getByRole("slider", { name: "Row index to inspect" });
    fireEvent.change(row, { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    const pairs = screen.getByRole("list", {
      name: "Diagnostic rows: label, prediction",
    });
    expect(pairs.querySelectorAll('[data-highlight="true"]')).toHaveLength(2);
    expect(
      pairs.querySelectorAll('[data-highlight="true"]')[0],
    ).toHaveTextContent("1");
    expect(
      pairs.querySelectorAll('[data-highlight="true"]')[1],
    ).toHaveTextContent("1.3");
    const squares = screen.getByRole("list", {
      name: "Squared differences, in the same row order",
    });
    expect(squares.querySelector('[data-highlight="true"]')).toHaveTextContent(
      "0.09",
    );
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Mean squared error: 0.15");

    fireEvent.change(screen.getByLabelText("Loss calculation"), {
      target: { value: "1" },
    });
    expect(row).toHaveAttribute("max", "1");
    expect(row).toHaveValue("1");
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Inputs changed. Run again");
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("list", { name: "Diagnostic rows: label, raw logit" }),
    ).toHaveTextContent("-3");
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Mean binary cross-entropy: 0.049");
    fireEvent.change(screen.getByLabelText("Loss calculation"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("list", { name: "Declared output contract" }),
    ).toHaveTextContent("binaryCrossentropy");
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Mean binary cross-entropy: 0.049");
  });

  it("retains a shared weight axis when pruning removes every connection", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS.pruning!}
        lessonSlug="pruning"
      />,
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Requested sparsity" }),
      {
        target: { value: "4" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    const original = screen.getByRole("img", { name: "Original connections" });
    const pruned = screen.getByRole("img", {
      name: "Connections after magnitude pruning",
    });
    for (const chart of [original, pruned]) {
      expect(chart).toHaveAttribute("data-domain-low", "-0.461");
      expect(chart).toHaveAttribute("data-domain-high", "0.362");
    }
  });

  it("gives retry guidance for a wrong prediction and clears runs on reset", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    const prediction = screen.getByLabelText("What total do you expect?");
    fireEvent.change(prediction, {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByText("Not quite. That’s incorrect."),
    ).toBeInTheDocument();
    expect(prediction).toHaveAttribute("aria-invalid", "true");
    expect(prediction).toHaveAccessibleDescription(/Not quite/);
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Incorrect prediction.");
    expect(
      screen.getByRole("region", { name: "What happened" }),
    ).toHaveTextContent("You predicted 2.");
    fireEvent.change(prediction, { target: { value: "5.005" } });
    expect(prediction).not.toHaveAttribute("aria-invalid");
    expect(prediction).not.toHaveAccessibleDescription(/Not quite/);
    expect(
      screen.getByRole("region", { name: "Last run (prediction changed)" }),
    ).toHaveTextContent("You predicted 2.");
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(prediction).not.toHaveAttribute("aria-invalid");
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Correct prediction.");
    fireEvent.change(screen.getByLabelText("First reading"), {
      target: { value: "8" },
    });
    expect(prediction).not.toHaveAttribute("aria-invalid");
    fireEvent.click(screen.getByRole("button", { name: "Reset experiment" }));
    expect(screen.getByLabelText("First reading")).toHaveValue("2");
    expect(screen.getByLabelText("What total do you expect?")).toHaveValue("");
    expect(
      screen.queryByRole("img", { name: "Output total" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Experiment reset");
  });

  it("loads the chosen example's inputs without relabeling a saved result", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    fireEvent.change(screen.getByLabelText("What total do you expect?"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "large" },
    });
    expect(screen.getByLabelText("First reading")).toHaveValue("6");
    expect(screen.getByLabelText("What total do you expect?")).toHaveValue("");
    expect(
      screen.getByRole("region", { name: "Last run (inputs changed)" }),
    ).toHaveTextContent("Small readings, Run 1");
    fireEvent.change(screen.getByLabelText("Operation"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Observed total: 18");
    expect(
      screen.getByRole("region", { name: "What happened" }),
    ).toHaveTextContent("Large readings, Run 2");
  });

  it("supports a choice prediction and keeps the briefing visual free of controls", () => {
    const choiceSpec: LessonInvestigationSpec = {
      ...spec,
      prediction: { prompt: "Which total do you expect?", choices: ["5", "8"] },
      evaluate(values, caseId) {
        return { ...spec.evaluate(values, caseId), answer: "5" };
      },
    };
    const { unmount } = render(
      <LessonInvestigation spec={choiceSpec} lessonSlug="test-lesson" />,
    );
    fireEvent.change(screen.getByLabelText("Which total do you expect?"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    unmount();
    render(<BriefingInvestigationVisual spec={spec} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Input readings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Output total" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(spec.brief)).not.toBeInTheDocument();
  });

  it("shows a skipped optional prediction as ungraded", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(screen.getByText("No prediction to check.")).toBeInTheDocument();
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Not quite. That’s incorrect."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("What total do you expect?"),
    ).not.toHaveAttribute("aria-invalid");
  });
});
