import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningObjectives } from "./learning-objectives";

const objectives = [
  "Understand what tensors are",
  "Create tensors with TensorFlow.js",
  "Inspect tensor shapes and data types",
];

describe("LearningObjectives", () => {
  it("renders the heading", () => {
    render(<LearningObjectives objectives={objectives} />);
    expect(screen.getByText("Learning Objectives")).toBeInTheDocument();
  });

  it("renders all objectives", () => {
    render(<LearningObjectives objectives={objectives} />);
    objectives.forEach((obj) => {
      expect(screen.getByText(obj)).toBeInTheDocument();
    });
  });

  it("renders objectives as list items", () => {
    const { container } = render(
      <LearningObjectives objectives={objectives} />,
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <LearningObjectives objectives={objectives} />,
    );
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
