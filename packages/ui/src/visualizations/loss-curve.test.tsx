import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LossCurve } from "./loss-curve";

function makeWeekly(values: Array<number | null>) {
  return values.map((v, i) => ({
    weekStart: `2026-0${1 + Math.floor(i / 4)}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
    avgHints: v,
  }));
}

describe("LossCurve", () => {
  const full = makeWeekly([
    5.0, 4.8, 4.2, 3.9, 3.5, 3.1, 2.9, 2.7, 2.5, 2.4, 2.3, 2.1,
  ]);

  it("renders role=img with labelledby/describedby pointing to id'd title+desc", () => {
    const { container } = render(<LossCurve weekly={full} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    const titleId = svg?.getAttribute("aria-labelledby");
    const descId = svg?.getAttribute("aria-describedby");
    expect(titleId).toBeTruthy();
    expect(descId).toBeTruthy();
    expect(svg?.querySelector(`title#${titleId}`)?.textContent).toMatch(
      /hints per exercise/i,
    );
    expect(svg?.querySelector(`desc#${descId}`)?.textContent).toMatch(
      /2\.1|decreas/i,
    );
    // Should NOT duplicate with aria-label
    expect(svg?.hasAttribute("aria-label")).toBe(false);
  });

  it("renders the comment-style header label", () => {
    const { container } = render(<LossCurve weekly={full} />);
    expect(container.textContent).toMatch(/\/\/ loss\.hints/);
  });

  it("renders empty-state text when all avgHints are null", () => {
    const allNull = makeWeekly([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    const { container } = render(<LossCurve weekly={allNull} />);
    expect(container.textContent).toMatch(/Complete 3\+ exercises/);
  });

  it("handles a single data point without crashing", () => {
    const single = makeWeekly([3.0]);
    expect(() => render(<LossCurve weekly={single} />)).not.toThrow();
    const { container } = render(<LossCurve weekly={single} />);
    expect(container.textContent).toMatch(/1 of 3\+/);
    expect(container.querySelector("desc")?.textContent).toMatch(
      /single data point/,
    );
  });

  it("matches snapshot for typical 12-week series", () => {
    const { container } = render(<LossCurve weekly={full} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
