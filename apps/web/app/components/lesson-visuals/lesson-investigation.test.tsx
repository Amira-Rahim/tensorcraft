import { afterEach, describe, expect, it } from "vitest";
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
  it("shows inputs before running and checks a prediction against the observed result", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    expect(
      screen.getByRole("list", { name: "Input readings" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Output total" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What total do you expect?"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(screen.getByText("Your prediction matches.")).toBeInTheDocument();
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
      .querySelector("rect")!;
    const latestBar = within(latest)
      .getByRole("img", { name: "Output total" })
      .querySelector("rect")!;
    expect(Number(priorBar.getAttribute("height"))).toBeLessThan(
      Number(latestBar.getAttribute("height")),
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

  it("gives retry guidance for a wrong prediction and clears runs on reset", () => {
    render(<LessonInvestigation spec={spec} lessonSlug="test-lesson" />);
    fireEvent.change(screen.getByLabelText("What total do you expect?"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(screen.getByText("Try another prediction.")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "What happened" }),
    ).toHaveTextContent("You predicted 2.");
    fireEvent.change(screen.getByLabelText("First reading"), {
      target: { value: "8" },
    });
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
    ).toHaveTextContent("Small readings · Run 1");
    fireEvent.change(screen.getByLabelText("Operation"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Observed total: 18");
    expect(
      screen.getByRole("region", { name: "What happened" }),
    ).toHaveTextContent("Large readings · Run 2");
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
    expect(screen.getByText("Your prediction matches.")).toBeInTheDocument();
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
});
