import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  comparisonDomain,
  InvestigationGraphic,
} from "./investigation-graphic";

afterEach(cleanup);

describe("investigation category charts", () => {
  it("shows every complete category and value while retaining its accessible table", () => {
    const labels = [
      "True positive",
      "False positive",
      "False negative",
      "True negative",
    ];
    render(
      <InvestigationGraphic
        graphic={{
          kind: "bars",
          label: "Evaluation counts",
          labels,
          values: [4, 2, 1, 5],
        }}
      />,
    );
    const chart = screen.getByRole("img", { name: "Evaluation counts" });
    expect(chart).toHaveAccessibleDescription(
      "True positive: 4, False positive: 2, False negative: 1, True negative: 5",
    );
    expect(
      Array.from(
        chart.querySelectorAll(".orbit-investigation-bar-label"),
        (label) => label.textContent,
      ),
    ).toEqual(labels);
    expect(
      Array.from(
        chart.querySelectorAll(".orbit-investigation-bar-value"),
        (value) => value.textContent,
      ),
    ).toEqual(["4", "2", "1", "5"]);
    const disclosure = screen.getByText("Read the values").closest("details")!;
    disclosure.open = true;
    const table = screen.getByRole("table", { name: "Evaluation counts" });
    expect(
      within(table).getByRole("rowheader", { name: "False negative" }),
    ).toBeVisible();
  });

  it("draws negative and positive values from the same zero and leaves zero empty", () => {
    render(
      <InvestigationGraphic
        graphic={{
          kind: "bars",
          label: "Signed contributions",
          labels: ["Negative", "Zero", "Positive"],
          values: [-2, 0, 6],
        }}
      />,
    );
    const chart = screen.getByRole("img", { name: "Signed contributions" });
    const bars = chart.querySelectorAll<HTMLElement>(
      ".orbit-investigation-bar-fill",
    );
    const zeroLines = chart.querySelectorAll<HTMLElement>(
      ".orbit-investigation-bar-zero",
    );
    expect(Array.from(zeroLines, (line) => line.style.left)).toEqual([
      "25%",
      "25%",
      "25%",
    ]);
    expect(
      Array.from(bars, (bar) => [bar.style.left, bar.style.width]),
    ).toEqual([
      ["0%", "25%"],
      ["25%", "0%"],
      ["25%", "75%"],
    ]);
  });

  it("does not combine unrelated bars and permits explicit same-unit comparisons", () => {
    const scores = {
      kind: "bars" as const,
      label: "Scores",
      values: [0.2, 0.8],
    };
    const counts = { kind: "bars" as const, label: "Counts", values: [3, 7] };
    expect(comparisonDomain(scores, [counts])).toEqual([0, 0.8]);
    expect(comparisonDomain(scores, [{ ...scores, values: [0.9] }])).toEqual([
      0, 0.9,
    ]);
    expect(
      comparisonDomain({ ...scores, scaleGroup: "weights" }, [
        { ...counts, label: "Pruned weights", scaleGroup: "weights" },
      ]),
    ).toEqual([0, 7]);
  });

  it("keeps continuous frequency bins in a compact plot with a complete values table", () => {
    render(
      <InvestigationGraphic
        graphic={{
          kind: "bars",
          layout: "series",
          label: "Frequency bins",
          labels: Array.from({ length: 33 }, (_, i) => `${i} Hz`),
          values: Array.from({ length: 33 }, (_, i) => i / 32),
        }}
      />,
    );
    const chart = screen.getByRole("img", { name: "Frequency bins" });
    expect(chart.tagName.toLowerCase()).toBe("svg");
    expect(chart.querySelectorAll("rect")).toHaveLength(33);
    screen.getByText("Read the values").closest("details")!.open = true;
    expect(
      within(
        screen.getByRole("table", { name: "Frequency bins" }),
      ).getAllByRole("rowheader"),
    ).toHaveLength(33);
  });

  it("keeps asymmetric signed bars zero-aligned without a colliding interior tick", () => {
    render(
      <InvestigationGraphic
        graphic={{
          kind: "bars",
          label: "Asymmetric contributions",
          labels: ["Weight term", "Negative term", "Bias"],
          values: [1.8, -0.15, 0],
        }}
      />,
    );
    const chart = screen.getByRole("img", { name: "Asymmetric contributions" });
    const axis = chart.querySelector(".orbit-investigation-bar-axis")!;
    expect(Array.from(axis.children, (tick) => tick.textContent)).toEqual([
      "-0.15",
      "1.8",
    ]);
    expect(
      chart.querySelectorAll(".orbit-investigation-bar-zero"),
    ).toHaveLength(3);
  });
});
