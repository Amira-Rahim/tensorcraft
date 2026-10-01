import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressView } from "./progress-view";
import { dashboardFixture } from "../__tests__/fixtures";
const weekly = (values: Array<number | null>) =>
  values.map((avgHints, i) => ({
    weekStart: `2026-09-${String(1 + i * 7).padStart(2, "0")}`,
    avgHints,
  }));
describe("progress disclosure", () => {
  it("shows the attempt sample and hides insufficient trends and unearned collections", () => {
    render(
      <ProgressView
        {...dashboardFixture({
          lossCurveData: { weekly: weekly([null, 0, null]) },
        })}
      />,
    );
    expect(
      screen.getByText(/Average across 1 recorded attempt in 1 lesson/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Hints used over time" }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Your collections" }),
    ).toBeNull();
  });
  it("shows the trend once three calendar weeks have data", () => {
    render(
      <ProgressView
        {...dashboardFixture({ lossCurveData: { weekly: weekly([3, 2, 0]) } })}
      />,
    );
    expect(
      screen.getByRole("img", { name: /Weekly average hints/ }),
    ).toBeInTheDocument();
  });
  it("provides an actionable empty state without zero score panels", () => {
    render(
      <ProgressView
        {...dashboardFixture({
          currentStreak: 0,
          scoredAttemptCount: 0,
          averageScore: null,
        })}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Exercise scores" }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Start learning →" }),
    ).toBeInTheDocument();
  });
});
