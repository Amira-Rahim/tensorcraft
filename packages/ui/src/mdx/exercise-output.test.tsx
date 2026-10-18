import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ExerciseOutput } from "./exercise-output";
import type { ExerciseArtifact } from "./exercise-artifacts.mjs";

const comparison: Extract<ExerciseArtifact, { kind: "series" }> = {
  kind: "series",
  title: "Forecast beside the observed readings",
  summary: "These are the values returned by your model.",
  xLabel: "Moment",
  yLabel: "Reading",
  labels: ["First", "Second", "Third"],
  series: [
    { name: "Forecast", values: [2, 3, 5] },
    { name: "Observed", values: [2, 4, 6] },
  ],
};

describe("ExerciseOutput", () => {
  it("keeps every finite value on a finite chart, including extreme and constant series", () => {
    const { container, rerender } = render(
      <ExerciseOutput
        artifacts={[
          {
            ...comparison,
            labels: ["First", "Second"],
            series: [
              {
                name: "Returned",
                values: [-Number.MAX_VALUE, Number.MAX_VALUE],
              },
            ],
          },
        ]}
        stale={false}
        complete
      />,
    );
    for (const values of [
      [-Number.MAX_VALUE, Number.MAX_VALUE],
      [Number.MAX_VALUE, Number.MAX_VALUE],
      [0, 0],
      [0, Number.MIN_VALUE],
    ]) {
      rerender(
        <ExerciseOutput
          artifacts={[
            {
              ...comparison,
              labels: ["First", "Second"],
              series: [{ name: "Returned", values }],
            },
          ]}
          stale={false}
          complete
        />,
      );
      const coordinates = container
        .querySelector("polyline")!
        .getAttribute("points")!
        .split(/[ ,]/)
        .map(Number);
      expect(coordinates.every(Number.isFinite)).toBe(true);
      expect(
        coordinates
          .filter((_, i) => i % 2 === 1)
          .every((value) => value >= 40 && value <= 240),
      ).toBe(true);
      expect(container.querySelector("svg")).not.toHaveTextContent(
        /NaN|Infinity/,
      );
    }
  });

  it("supports named series selection and an accessible table of the exact values", () => {
    const { container } = render(
      <ExerciseOutput artifacts={[comparison]} stale={false} complete />,
    );
    expect(
      screen.getByRole("region", { name: "Output from your code" }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: /Forecast beside the observed readings/,
      }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Forecast" }));
    expect(screen.getByRole("button", { name: "Forecast" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "All series" }));
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
    fireEvent.click(screen.getByText("Read the values"));
    const region = screen.getByRole("region", {
      name: /Forecast beside the observed readings/,
    });
    const table = within(region).getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Moment", "Forecast", "Observed"]);
    expect(within(table).getAllByRole("row")[3]).toHaveTextContent("Third56");
  });

  it("resets the selected series for a new run and announces edited-code output as stale", () => {
    const { container, rerender } = render(
      <ExerciseOutput artifacts={[comparison]} stale={false} complete />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Observed" }));
    rerender(
      <ExerciseOutput
        artifacts={[{ ...comparison, series: [comparison.series[0]!] }]}
        stale
        complete={false}
      />,
    );
    expect(screen.getByRole("button", { name: "All series" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your code has changed. Run it again to update these results.",
    );
  });

  it("keeps the returned numeric precision in the data table", () => {
    render(
      <ExerciseOutput
        artifacts={[
          {
            kind: "table",
            title: "Measured reconstruction error",
            columns: ["MSE"],
            rows: [[0.12345678901234568]],
          },
        ]}
        stale={false}
        complete
      />,
    );
    expect(screen.getByRole("cell")).toHaveTextContent("0.12345678901234568");
  });
});
