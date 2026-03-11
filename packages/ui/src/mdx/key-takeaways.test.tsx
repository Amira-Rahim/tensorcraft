import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyTakeaways } from "./key-takeaways";

const takeaways = [
  "Tensors are multi-dimensional arrays",
  "TensorFlow.js runs in the browser",
  "Shape defines the dimensions of a tensor",
];

describe("KeyTakeaways", () => {
  it("renders the heading", () => {
    render(<KeyTakeaways takeaways={takeaways} />);
    expect(screen.getByText("Key Takeaways")).toBeInTheDocument();
  });

  it("renders all takeaways", () => {
    render(<KeyTakeaways takeaways={takeaways} />);
    takeaways.forEach((t) => {
      expect(screen.getByText(t)).toBeInTheDocument();
    });
  });

  it("renders takeaways as list items", () => {
    const { container } = render(<KeyTakeaways takeaways={takeaways} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("shows checkmark symbols", () => {
    const { container } = render(<KeyTakeaways takeaways={takeaways} />);
    const checkmarks = container.querySelectorAll("li span");
    expect(checkmarks.length).toBeGreaterThanOrEqual(3);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<KeyTakeaways takeaways={takeaways} />);
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
