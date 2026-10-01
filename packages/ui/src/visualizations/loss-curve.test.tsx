import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LossCurve } from "./loss-curve";
const weekly = (values: Array<number | null>) =>
  values.map((avgHints, i) => ({
    weekStart: new Date(Date.UTC(2026, 8, 7 + i * 7))
      .toISOString()
      .slice(0, 10),
    avgHints,
  }));
describe("weekly hint trend", () => {
  it("counts weeks with data rather than exercises, and omits an insufficient chart", () => {
    const { container } = render(
      <LossCurve weekly={weekly([null, 0, null])} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 of 3 weeks with hint data",
    );
    expect(container.querySelector("svg")).toBeNull();
  });
  it("handles no observations without a large blank plot", () => {
    render(<LossCurve weekly={weekly([null, null])} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "No hint data recorded yet",
    );
  });
  it("uses accessible names and units with no misleading loss label", () => {
    const { container } = render(<LossCurve weekly={weekly([3, 2, 0])} />);
    const svg = screen.getByRole("img", {
      name: "Weekly average hints per exercise attempt",
    });
    expect(svg.getAttribute("aria-describedby")).toBeTruthy();
    expect(container.textContent).toContain("Hint levels per attempt");
    expect(container.textContent).not.toContain("loss.hints");
  });
  it("does not connect across missing weeks", () => {
    const { container } = render(
      <LossCurve weekly={weekly([3, null, 2, 0])} />,
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
  });
  it("gives multiple charts distinct accessible identifiers", () => {
    const { container } = render(
      <>
        <LossCurve weekly={weekly([3, 2, 0])} />
        <LossCurve weekly={weekly([1, 2, 3])} />
      </>,
    );
    const ids = [...container.querySelectorAll("svg")].map((svg) =>
      svg.getAttribute("aria-labelledby"),
    );
    expect(new Set(ids).size).toBe(2);
  });
});
