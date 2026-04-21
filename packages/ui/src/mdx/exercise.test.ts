import { describe, it, expect } from "vitest";

// Patch CSSStyleSheet.insertRule to swallow unknown/unsupported CSS rules
// (e.g. stitches/Sandpack emits `--sxs{--sxs:6}` which jsdom's CSSOM parser
// rejects). Stitches expects inserted rules to be retrievable via cssRules,
// so on parse failure we fall back to inserting a harmless placeholder rule
// at the same index to keep indices in sync.
// Must run before importing the module under test, which transitively loads
// @codesandbox/sandpack-react → @stitches/core at module scope.
if (
  typeof CSSStyleSheet !== "undefined" &&
  CSSStyleSheet.prototype.insertRule
) {
  const originalInsertRule = CSSStyleSheet.prototype.insertRule;
  CSSStyleSheet.prototype.insertRule = function patchedInsertRule(
    rule: string,
    index?: number,
  ): number {
    try {
      return originalInsertRule.call(this, rule, index);
    } catch {
      // Swallow CSS parse errors from libraries that emit non-standard rules.
      // Insert a harmless placeholder so cssRules indices remain consistent.
      try {
        return originalInsertRule.call(this, ".__sxs_stub__{}", index);
      } catch {
        return index ?? 0;
      }
    }
  };
}

const { parseAndRunTests } = await import("./exercise");

describe("parseAndRunTests", () => {
  it("runs a passing synchronous test", async () => {
    const userCode = "function add(a, b) { return a + b; }";
    const testCode =
      "it('adds numbers', function() { expect(add(1, 2)).toBe(3); });";

    const { results, logs } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].name).toBe("adds numbers");
    expect(logs).toEqual([]);
  });

  it("runs a failing test with error message", async () => {
    const userCode = "function add(a, b) { return a - b; }";
    const testCode =
      "it('adds numbers', function() { expect(add(1, 2)).toBe(3); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].error).toBeDefined();
  });

  it("runs async tests", async () => {
    const userCode =
      "async function fetchValue() { return Promise.resolve(42); }";
    const testCode =
      "it('resolves value', async function() { var v = await fetchValue(); expect(v).toBe(42); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("supports describe blocks", async () => {
    const userCode = "function double(x) { return x * 2; }";
    const testCode = `
      describe('double', function() {
        it('doubles 2', function() { expect(double(2)).toBe(4); });
        it('doubles 0', function() { expect(double(0)).toBe(0); });
      });
    `;

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.passed)).toBe(true);
    expect(results[0].name).toBe("double > doubles 2");
  });

  it("supports toBeCloseTo for floating point", async () => {
    const userCode = "var result = 0.1 + 0.2;";
    const testCode =
      "it('is close to 0.3', function() { expect(result).toBeCloseTo(0.3, 5); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("strips import statements", async () => {
    const userCode = `import * as tf from '@tensorflow/tfjs';
var t = tf.tensor([1, 2, 3]);`;
    const testCode =
      "it('creates tensor', function() { expect(t.shape).toEqual([3]); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("provides tf.tensor with real data", async () => {
    const userCode = "var t = tf.tensor([10, 20, 30]);";
    const testCode = `
      it('has correct shape', function() { expect(t.shape).toEqual([3]); });
      it('has correct data', function() {
        var d = Array.from(t.dataSync());
        expect(d).toEqual([10, 20, 30]);
      });
    `;

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it("provides tf.add with real computation", async () => {
    const userCode = `
      var a = tf.tensor([1, 2, 3]);
      var b = tf.tensor([4, 5, 6]);
      var c = tf.add(a, b);
    `;
    const testCode =
      "it('adds element-wise', function() { expect(Array.from(c.dataSync())).toEqual([5, 7, 9]); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("catches syntax errors", async () => {
    const userCode = "function broken( { return }";
    const testCode = "it('runs', function() { expect(true).toBe(true); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].name).toBe("Code execution");
  });

  it("times out on infinite loops", async () => {
    const userCode = "while(true) {}";
    const testCode = "it('runs', function() { expect(true).toBe(true); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].error).toMatch(/timed out/i);
  }, 15_000);

  // Phase 11 §11d Wave 3 — parseAndRunTests now returns { results, logs }
  // so the Exercise component can render a ConsolePanel. The existing tests
  // above exercise the `results` shape; these cover the new `logs` shape.
  it("always returns a { results, logs } outcome object", async () => {
    const userCode = "var x = 1;";
    const testCode = "it('ok', function() { expect(1).toBe(1); });";

    const outcome = await parseAndRunTests(userCode, testCode);
    expect(outcome).toHaveProperty("results");
    expect(outcome).toHaveProperty("logs");
    expect(Array.isArray(outcome.results)).toBe(true);
    expect(Array.isArray(outcome.logs)).toBe(true);
  });

  it("captures console.error as an error-level log entry", async () => {
    // `console.error` runs during harness setup (no test-level `expect` needed
    // to fail), so even if the surrounding harness is misbehaving the log
    // capture path still fires before any failure.
    const userCode = "console.error('boom');";
    const testCode = "it('runs', function() { expect(true).toBe(true); });";

    const { logs } = await parseAndRunTests(userCode, testCode);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const errorEntries = logs.filter((l) => l.level === "error");
    expect(errorEntries.length).toBeGreaterThanOrEqual(1);
    expect(errorEntries[0].message).toContain("boom");
  });
});
