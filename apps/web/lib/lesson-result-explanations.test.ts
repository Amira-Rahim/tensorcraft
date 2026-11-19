// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../../packages/ui/src/mdx/exercise-runner-node";
import { WORKED_PACKET } from "../app/components/mdx/channel-layout-data";
import {
  sensorArtifacts,
  gradientArtifacts,
  denseForwardArtifacts,
} from "../app/components/__fixtures__/lesson-results";
import {
  readLessonResultExplanation,
  supportsLessonResultExplanation,
} from "./lesson-result-explanations";

describe("known lesson result contracts", () => {
  it.each(["create-a-tensor", "reshape-tensor"])(
    "retains captured values and keeps supplied source separate for %s",
    (slug) => {
      const artifacts = sensorArtifacts(slug);
      const chart = artifacts[0]!;
      if (chart.kind !== "series") throw Error("Expected chart");
      chart.series[0]!.values[0] = 902;
      const result = readLessonResultExplanation(slug, artifacts);
      expect(result?.kind).toBe("sensor-layout");
      if (result?.kind !== "sensor-layout")
        throw Error("Missing decoded chart");
      expect(result.sourceId).toBe("demir-recording");
      expect(result.sourceRows[0]![0]).toBe(2);
      expect(result.series[0]!.values[0]).toBe(902);
      chart.series[0]!.values[0] = 4;
      expect(result.series[0]!.values[0]).toBe(902);
      expect(result.sourceRows).not.toBe(WORKED_PACKET);
      expect(WORKED_PACKET[0]![0]).toBe(2);
    },
  );

  it("uses the artifact's actual index instead of assuming the first output is the chart", () => {
    const result = readLessonResultExplanation("reshape-tensor", [
      { kind: "text", title: "Other output", text: "Before the chart" },
      ...sensorArtifacts(),
    ]);
    expect(result?.kind === "sensor-layout" && result.artifactIndex).toBe(1);
  });

  it.each([
    "duplicate",
    "sensor-order",
    "axis",
    "labels",
    "nonfinite",
    "length",
    "title",
  ])("rejects ambiguous or malformed %s chart contracts", (failure) => {
    const artifacts = sensorArtifacts();
    const chart = artifacts[0]!;
    if (chart.kind !== "series") throw Error("Expected chart");
    if (failure === "duplicate") artifacts.push(chart);
    if (failure === "sensor-order") chart.series.reverse();
    if (failure === "axis") chart.yLabel = "Accuracy";
    if (failure === "labels") chart.labels.reverse();
    if (failure === "nonfinite") chart.series[0]!.values[0] = Infinity;
    if (failure === "length") chart.series[0]!.values.pop();
    if (failure === "title") chart.title = "A different source";
    expect(readLessonResultExplanation("reshape-tensor", artifacts)).toBeNull();
  });

  it("decodes the two compatible gradient tables without replacing reported estimates", () => {
    const original = gradientArtifacts();
    const result = readLessonResultExplanation("backprop-chain", original);
    expect(result).toEqual({
      kind: "gradient-comparison",
      variables: [
        { name: "a", automatic: 0.32, numerical: 0.321 },
        { name: "b", automatic: -1, numerical: -0.999 },
        { name: "c", automatic: 1.5, numerical: 1.5 },
      ],
      automaticCalls: 1,
      numericalCalls: 6,
    });
    expect(original).toEqual(gradientArtifacts());
  });

  it.each([
    "missing",
    "duplicate",
    "column-order",
    "duplicate-variable",
    "negative-calls",
    "fractional-calls",
    "nonfinite",
    "wrong-method",
  ])("omits gradient interpretation for %s captures", (failure) => {
    const artifacts = gradientArtifacts();
    const values = artifacts[0]!;
    const counts = artifacts[1]!;
    if (values.kind !== "table" || counts.kind !== "table")
      throw Error("Expected tables");
    if (failure === "missing") artifacts.pop();
    if (failure === "duplicate") artifacts.push(values);
    if (failure === "column-order") values.columns.reverse();
    if (failure === "duplicate-variable") values.rows[1]![0] = "a";
    if (failure === "negative-calls") counts.rows[0]![1] = -1;
    if (failure === "fractional-calls") counts.rows[1]![1] = 1.5;
    if (failure === "nonfinite") values.rows[0]![1] = NaN;
    if (failure === "wrong-method") counts.rows[0]![0] = "Measured speed";
    expect(readLessonResultExplanation("backprop-chain", artifacts)).toBeNull();
  });

  it("leaves unsupported, empty, and invalid output to the ordinary renderer", () => {
    expect(supportsLessonResultExplanation("normalize-data")).toBe(false);
    for (const value of [
      null,
      [],
      {},
      [{ kind: "html", title: "Injected", text: "<script>" }],
    ]) {
      expect(readLessonResultExplanation("reshape-tensor", value)).toBeNull();
    }
    expect(
      readLessonResultExplanation("unknown", sensorArtifacts()),
    ).toBeNull();
  });

  it("retains the captured forward inputs, random weights, bias and outputs without substituting reference values", () => {
    const artifacts = denseForwardArtifacts();
    const table = artifacts[0]!;
    if (table.kind !== "table") throw Error("Expected values");
    table.rows[0]![3] = 902;
    const result = readLessonResultExplanation("forward-pass", artifacts);
    expect(result?.kind).toBe("dense-forward");
    if (result?.kind !== "dense-forward") throw Error("Missing forward result");
    expect(result.readings[0]).toEqual({
      id: 1,
      inputs: [1, 2],
      outputs: [902, -0.3, 0.7],
    });
    expect(result.kernel).toEqual([
      [0.5, -1, 2],
      [1, 0.25, -0.5],
    ]);
    expect(result.bias).toEqual([0.1, 0.2, -0.3]);
    table.rows[0]![3] = 3;
    expect(result.readings[0]!.outputs[0]).toBe(902);
  });

  it.each([
    "missing",
    "duplicate",
    "column-order",
    "parameter-order",
    "reading-order",
    "nonnumeric",
    "nonfinite",
    "row-count",
    "unknown-title",
  ])("leaves a %s forward capture to ordinary output", (failure) => {
    const artifacts = denseForwardArtifacts();
    const values = artifacts[0]!;
    const weights = artifacts[1]!;
    if (values.kind !== "table" || weights.kind !== "table")
      throw Error("Expected tables");
    if (failure === "missing") artifacts.pop();
    if (failure === "duplicate") artifacts.push(weights);
    if (failure === "column-order") values.columns.reverse();
    if (failure === "parameter-order") weights.rows.reverse();
    if (failure === "reading-order") values.rows.reverse();
    if (failure === "nonnumeric") weights.rows[0]![1] = "unknown";
    if (failure === "nonfinite") weights.rows[1]![2] = Infinity;
    if (failure === "row-count") values.rows.pop();
    if (failure === "unknown-title") weights.title = "Another model";
    expect(readLessonResultExplanation("forward-pass", artifacts)).toBeNull();
  });

  const exercises = JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/content/.velite/exercises.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as Array<{ slug: string; solutionCode: string; testCode: string }>;
  it.each([
    "create-a-tensor",
    "reshape-tensor",
    "backprop-chain",
    "forward-pass",
  ])(
    "decodes actual shipped-Worker captures from %s",
    { timeout: 60_000 },
    async (slug) => {
      const exercise = exercises.find((item) => item.slug === slug)!;
      const run = await parseAndRunTests(
        exercise.solutionCode,
        exercise.testCode,
        45_000,
      );
      expect(run.errored).not.toBe(true);
      expect(run.results.length).toBeGreaterThan(0);
      expect(run.results.filter((check) => !check.passed)).toEqual([]);
      expect(readLessonResultExplanation(slug, run.artifacts)?.kind).toBe(
        slug === "backprop-chain"
          ? "gradient-comparison"
          : slug === "forward-pass"
            ? "dense-forward"
            : "sensor-layout",
      );
    },
  );
});
