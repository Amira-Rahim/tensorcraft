import { describe, expect, it } from "vitest";
import { scanStops, type StopSpec } from "./scan-stops";

// The editor's text: the BUILT starter of create-a-tensor (tsToJs drops the
// YAML's blank lines).
const STARTER = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "// Your work: replace the two nulls.",
  "const reading = null;",
  "const shape = null;",
  "// Supplied: copy the readings into a JavaScript array for Farah.",
  "const values = reading?.arraySync();",
  "// Supplied: release memory after copying the values.",
  "reading?.dispose();",
  "",
];
const STEPS: StopSpec[] = [
  { target: "reading", code: "tf.tensor(streamValues)" },
  { target: "shape", code: "reading.shape" },
];
const replaceLine = (index: number, text: string) =>
  STARTER.map((line, i) => (i === index ? text : line));

describe("scanStops", () => {
  it("finds both starter stops waiting on lines 3 and 4", () => {
    expect(scanStops(STARTER, STEPS)).toEqual([
      { line: 3, state: "waiting", rhsStart: 16, rhsEnd: 20, matches: 1 },
      { line: 4, state: "waiting", rhsStart: 14, rhsEnd: 18, matches: 1 },
    ]);
  });

  it("reads the step's code as typed, ignoring spaces and the semicolon", () => {
    for (const text of [
      "const reading = tf.tensor(streamValues);",
      "const reading=tf.tensor( streamValues )",
      "  let reading = tf.tensor(streamValues) ;",
    ]) {
      expect(scanStops(replaceLine(2, text), STEPS)[0].state, text).toBe(
        "typed",
      );
    }
  });

  it("reads any other right-hand side as other code", () => {
    expect(
      scanStops(
        replaceLine(2, "const reading = tf.tensor1d(streamValues);"),
        STEPS,
      )[0],
    ).toMatchObject({ line: 3, state: "other", matches: 1 });
  });

  it("reports a deleted or commented-out declaration as missing", () => {
    const missing = {
      line: null,
      state: "missing",
      rhsStart: 0,
      rhsEnd: 0,
      matches: 0,
    };
    expect(
      scanStops(replaceLine(2, "// const reading = null;"), STEPS)[0],
    ).toEqual(missing);
    expect(
      scanStops(
        STARTER.filter((_, i) => i !== 2),
        STEPS,
      )[0],
    ).toEqual(missing);
  });

  it("does not take a longer name that starts with the target", () => {
    expect(scanStops(["const readings = null;"], STEPS)[0].state).toBe(
      "missing",
    );
  });

  it("counts every declaration and reports the first", () => {
    expect(
      scanStops([...STARTER, "const reading = null;"], STEPS)[0],
    ).toMatchObject({ line: 3, matches: 2 });
  });

  it("follows the code when lines are inserted above", () => {
    expect(
      scanStops(["// a new first line", ...STARTER], STEPS).map(
        (scan) => scan.line,
      ),
    ).toEqual([4, 5]);
  });

  it("handles empty and one-line inputs", () => {
    expect(scanStops([], STEPS).map((scan) => scan.state)).toEqual([
      "missing",
      "missing",
    ]);
    expect(
      scanStops(["const reading = null;"], STEPS).map((scan) => scan.line),
    ).toEqual([1, null]);
  });

  it("honours a custom placeholder and escapes the target", () => {
    expect(
      scanStops(
        ["let total = 0;"],
        [{ target: "total", code: "sum(xs)", placeholder: "0" }],
      )[0].state,
    ).toBe("waiting");
    expect(
      scanStops(["const $x = null;"], [{ target: "$x", code: "1" }])[0].state,
    ).toBe("waiting");
  });
});
