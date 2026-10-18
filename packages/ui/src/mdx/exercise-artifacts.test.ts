// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ARTIFACT_COLLECTOR_SOURCE,
  createArtifactCollector,
  validateArtifacts,
} from "./exercise-artifacts.mjs";
import { parseAndRunTests } from "./exercise-runner-node";
import { parseAndRunTestsWith, type WorkerReply } from "./exercise-runner";

describe("actual exercise output", () => {
  it("copies data before later mutation and accepts the same code in a worker", () => {
    const collector = new Function(`return ${ARTIFACT_COLLECTOR_SOURCE}`)()();
    const rows = [[2, 3]];
    collector.record({
      kind: "table",
      title: "Readings",
      columns: ["A", "B"],
      rows,
    });
    rows[0]![0] = 999;
    expect(collector.read()[0].rows).toEqual([[2, 3]]);
  });
  it("rejects nonfinite numbers, mismatched axes, and oversized output", () => {
    const collector = createArtifactCollector();
    expect(() =>
      collector.record({
        kind: "table",
        title: "x",
        columns: ["x"],
        rows: [[NaN]],
      }),
    ).toThrow();
    expect(() =>
      collector.record({
        kind: "series",
        title: "x",
        xLabel: "time",
        yLabel: "reading",
        labels: ["1", "2"],
        series: [{ name: "A", values: [1] }],
      }),
    ).toThrow();
    expect(() =>
      collector.record({ kind: "text", title: "x", text: "x".repeat(6001) }),
    ).toThrow();
    expect(() =>
      validateArtifacts(
        Array.from({ length: 5 }, () => ({
          kind: "text",
          title: "x",
          text: "ok",
        })),
      ),
    ).toThrow();
  });
  it("rejects missing entries instead of silently turning them into displayed nulls", () => {
    const collector = createArtifactCollector();
    expect(() =>
      collector.record({
        kind: "table",
        title: "Readings",
        columns: ["A"],
        rows: [Array(1)],
      }),
    ).toThrow();
    expect(() =>
      collector.record({
        kind: "series",
        title: "Readings",
        xLabel: "Moment",
        yLabel: "Reading",
        labels: ["1"],
        series: [{ name: "A", values: Array(1) }],
      }),
    ).toThrow();
    expect(() => validateArtifacts(Array(1))).toThrow();
  });
  it("turns malformed worker output into a failed check without displaying it", async () => {
    let reply!: (value: WorkerReply) => void;
    let terminated = false;
    const result = await parseAndRunTestsWith(
      async () => ({
        onReply: (callback) => {
          reply = callback;
        },
        send: () =>
          queueMicrotask(() =>
            reply({
              ok: true,
              results: [{ name: "shape matches", passed: true }],
              logs: [],
              artifacts: [
                {
                  kind: "series",
                  title: "Bad output",
                  xLabel: "Moment",
                  yLabel: "Reading",
                  labels: ["1"],
                  series: [{ name: "A", values: [Infinity] }],
                },
              ],
            }),
          ),
        terminate: () => {
          terminated = true;
        },
      }),
      "",
      "",
    );
    expect(result.errored).toBe(true);
    expect(result.results).toContainEqual(
      expect.objectContaining({ name: "Display your result", passed: false }),
    );
    expect(result.artifacts ?? []).toEqual([]);
    expect(terminated).toBe(true);
  });
  it("returns the submitted tensor's output after disposal from the graded run", async () => {
    const result = await parseAndRunTests(
      "const tensor = tf.tensor([2, 3, 4]);",
      `it('reads the tensor', () => {
      const values = Array.from(tensor.dataSync());
      expect(values).toEqual([2, 3, 4]);
      recordResult({kind:'series',title:'Sensor A',xLabel:'Moment',yLabel:'Reading',labels:['1','2','3'],series:[{name:'A',values}]});
      tensor.dispose();
    });`,
    );
    expect(result.results.every((r) => r.passed)).toBe(true);
    expect(result.artifacts?.[0]).toMatchObject({
      series: [{ values: [2, 3, 4] }],
    });
    const next = await parseAndRunTests(
      "",
      "it('fails', () => { expect(1).toBe(2); });",
    );
    expect(next.artifacts).toEqual([]);
  }, 20000);
});
