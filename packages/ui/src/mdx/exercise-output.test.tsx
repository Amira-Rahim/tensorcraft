import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contrastRatio, worldSlugs } from "@tensorcraft/worlds";
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
  it("keeps every series visible against all themed chart surfaces", () => {
    const css = readFileSync(
      resolve(__dirname, "../../../worlds/src/css/worlds.css"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    const { container } = render(
      <ExerciseOutput
        artifacts={[
          {
            ...comparison,
            series: Array.from({ length: 8 }, (_, index) => ({
              name: `Series ${index + 1}`,
              values: [index, index + 1, index + 2],
            })),
          },
        ]}
        stale={false}
        complete
      />,
    );
    const lines = Array.from(
      container.querySelectorAll("[data-exercise-series]"),
    );
    expect(lines).toHaveLength(8);
    for (const world of worldSlugs) {
      for (const scheme of ["dark", "light"]) {
        const selectors = new Set([
          ":root",
          `[data-world="${world}"]`,
          ...(scheme === "light"
            ? [
                '[data-scheme="light"]',
                `[data-world="${world}"][data-scheme="light"]`,
              ]
            : []),
        ]);
        const variables = new Map<string, string>();
        for (const block of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
          if (
            !block[1]!
              .split(",")
              .some((selector) => selectors.has(selector.trim()))
          )
            continue;
          for (const declaration of block[2]!.matchAll(
            /(--[\w-]+):\s*([^;]+);/g,
          )) {
            variables.set(declaration[1]!, declaration[2]!.trim());
          }
        }
        const color = (value: string): string => {
          const token = value.match(/^var\((--[\w-]+)/)?.[1];
          if (token) return color(variables.get(token)!);
          expect(value).toMatch(/^#[0-9a-f]{6}$/i);
          return value;
        };
        for (const line of lines) {
          const stroke = color(line.getAttribute("stroke")!);
          expect(color(line.getAttribute("fill")!)).toBe(stroke);
          for (const surface of [
            "--tc-bg",
            "--tc-surface",
            "--tc-surface-overlay",
          ]) {
            expect(
              contrastRatio(stroke, color(variables.get(surface)!)),
              `${world} ${scheme} series ${line.getAttribute("data-exercise-series")} on ${surface}`,
            ).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
    const lastColor = lines[7]!.getAttribute("stroke");
    fireEvent.click(screen.getByRole("button", { name: "Series 8" }));
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(container.querySelector("[data-exercise-series]")).toHaveAttribute(
      "stroke",
      lastColor,
    );
  });

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
