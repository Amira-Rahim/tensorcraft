import { describe, it, expect } from "vitest";
import { parseAndRunTests } from "./exercise-runner-node";

describe("parseAndRunTests", () => {
  it("reports the executing TensorFlow.js version and backend", async () => {
    const outcome = await parseAndRunTests(
      "const reading = tf.tensor1d([1]);",
      "it('reads', () => expect(reading.dataSync()[0]).toBe(1));",
    );
    expect(outcome.runtimeVersion).toBe("4.22.0");
    expect(outcome.backend).toBe("cpu");
  });
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

  it("fails toBeCloseTo for non-numeric actuals (NaN guard)", async () => {
    // Regression: `Math.abs({} - 0.3)` is NaN and `NaN >= limit` is false, so
    // the old comparison silently passed any non-numeric actual - a constant
    // `return {}` defeated every toBeCloseTo-only suite.
    const userCode = "var objResult = {}; var nanResult = NaN;";
    const testCode = `
      it('object is not close', function() { expect(objResult).toBeCloseTo(0.3, 5); });
      it('NaN is not close', function() { expect(nanResult).toBeCloseTo(0.3, 5); });
    `;

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(2);
    expect(results.every((r) => !r.passed)).toBe(true);
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

  it("names a syntax error in the learner's code as the cause", async () => {
    const userCode = "function broken( { return }";
    const testCode = "it('runs', function() { expect(true).toBe(true); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].name).toBe("Your code has a syntax error");
    expect(results[0].error).toContain("could not parse your code");
  });

  it("blames the learner's brace, not the harness, on a missing brace", async () => {
    // The harness concatenates user code and test code into one function
    // body, so an unclosed function used to swallow the harness's own
    // `await __awaitPending()` and report "await is only valid in async
    // functions" under the name "Code execution" (completeness critic,
    // 2026-09-08).
    const userCode = "function neuron(x) {\n  return x * 2;\n";
    const testCode =
      "it('doubles', function() { expect(neuron(2)).toBe(4); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Your code has a syntax error");
    expect(results[0].error).not.toContain("await is only valid");
    expect(results[0].error).toContain("brace");
  });

  it("prints an authored message above the discrepancy", async () => {
    const userCode = "var loss = 0.9;";
    const testCode =
      "it('loss falls', function() { expect(loss, 'A rising loss means the step went uphill.').toBeLessThan(0.5); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    const lines = String(results[0].error).split("\n");
    expect(lines[0]).toBe("A rising loss means the step went uphill.");
    expect(lines[1]).toContain("requires a value less than 0.5");
  });

  it("withholds a graded numeric answer from the failure text", async () => {
    // The results panel opens on the first Run of the untouched starter, so
    // a printed expected value is an answer key that costs one click.
    const userCode = "var out = [0.1, 0.2, 0.3];";
    const testCode = `
      it('scalar', function() { expect(0.51).toBe(0.7314); });
      it('vector', function() { expect(out).toEqual([0.1, 0.9, 0.3]); });
      it('close', function() { expect(0.51).toBeCloseTo(0.5123456, 5); });
    `;

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(3);
    const text = results.map((r) => r.error).join(" | ");
    expect(text).not.toContain("0.7314");
    expect(text).not.toContain("0.9");
    expect(text).not.toContain("0.5123456");
    // What it does say: the learner's own value, the direction, the position.
    expect(results[0].error).toContain("too low");
    expect(results[1].error).toContain("index 1");
    expect(results[2].error).toContain("at most 0.000005");
  });

  it("keeps a non-numeric expected value visible", async () => {
    // A string names an API choice, not a computed answer; hiding it turns a
    // typo into a guessing game.
    const userCode = "var activation = 'relu';";
    const testCode =
      "it('uses sigmoid', function() { expect(activation).toBe('sigmoid'); });";

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results[0].error).toContain("sigmoid");
    expect(results[0].error).toContain("relu");
  });

  it("installs the expect statics and the jest stub", async () => {
    // Regression: the browser harness used to reassign `expect` to add a
    // promise chain, which dropped every static set on the original
    // function, so `expect.closeTo` existed in CI and not in the browser.
    const userCode = "var x = 1;";
    const testCode = `
      it('statics', function() {
        expect(typeof expect.closeTo).toBe('function');
        expect(typeof expect.any).toBe('function');
        expect(typeof jest.fn).toBe('function');
      });
    `;

    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("times out on infinite loops", async () => {
    const userCode = "while(true) {}";
    const testCode = "it('runs', function() { expect(true).toBe(true); });";

    const { results } = await parseAndRunTests(userCode, testCode, 2_000);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].error).toMatch(/timed out/i);
  }, 15_000);

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
    const userCode = "console.error('boom');";
    const testCode = "it('runs', function() { expect(true).toBe(true); });";

    const { logs } = await parseAndRunTests(userCode, testCode);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const errorEntries = logs.filter((l) => l.level === "error");
    expect(errorEntries.length).toBeGreaterThanOrEqual(1);
    expect(errorEntries[0].message).toContain("boom");
  });

  it("counts the submission's tf entry-point calls on tf.__calls, per run", async () => {
    // The call spy (2026-09-13): graders that exist to teach a call (autograd,
    // model.save, one model built rather than measured) read the count off
    // tf.__calls. Same counters in the CI validator; the corpus parity test
    // keeps them in step.
    const userCode = [
      "const w = tf.variable(tf.scalar(2));",
      "const { grads } = tf.variableGrads(() => w.square().asScalar());",
      "const m = tf.sequential();",
      "m.add(tf.layers.dense({ units: 1, inputShape: [1] }));",
      "const opt = tf.train.sgd(0.1);",
    ].join("\n");
    const testCode = [
      "it('saw the calls', function() {",
      "  expect(tf.__calls.variableGrads).toBe(1);",
      "  expect(tf.__calls.sequential).toBe(1);",
      "  expect(tf.__calls['layers.dense']).toBe(1);",
      "  expect(tf.__calls['train.sgd']).toBe(1);",
      "  expect(tf.__calls['tensor.square']).toBe(1);",
      "  m.predict(tf.zeros([1, 1])); m.predict(tf.zeros([2, 1]));",
      "  expect(tf.__calls['model.predict']).toBe(2);",
      "  expect(tf.__calls.matMul).toBe(undefined);",
      "  expect(tf.__calls.grad).toBe(undefined);",
      "});",
    ].join("\n");
    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].error).toBeUndefined();
    expect(results[0].passed).toBe(true);
    // Fresh per run: a second run starts from zero.
    const again = await parseAndRunTests(
      "const x = tf.scalar(1);",
      "it('fresh counters', function() { expect(tf.__calls.variableGrads).toBe(undefined); });",
    );
    expect(again.results[0].passed).toBe(true);
  });

  it("gives the ONNX stub the lifecycle calls the real library has: session.release() and tensor.dispose()", async () => {
    // Lesson 5 tells the reader to release the session and dispose the
    // feed. Until 2026-09-13 (round 7) neither existed on the stub, so the
    // most careful learner failed every test with a bare TypeError. Same
    // no-ops in the CI validator's stub.
    const userCode = [
      "const session = await ort.InferenceSession.create('/models/x.onnx');",
      "const feed = new ort.Tensor('float32', new Float32Array([0.5, 0.59, 0.54]), [1, 3]);",
      "const out = await session.run({ input: feed });",
      "const score = out.output.data[0];",
      "feed.dispose();",
      "await session.release();",
    ].join("\n");
    const testCode = [
      "it('ran, then released', function() {",
      "  expect(typeof score).toBe('number');",
      "  expect(typeof feed.dispose).toBe('function');",
      "  expect(typeof session.release).toBe('function');",
      "});",
    ].join("\n");
    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].error).toBeUndefined();
    expect(results[0].passed).toBe(true);
  });

  it("locks the Math binding, the counters, the read path and tf.util against a submission", async () => {
    // Round 7b (2026-09-14): the property seal above held, and three routes
    // around it did not. `globalThis.Math = copyWithRandomPinned` replaced
    // the sealed object; `tf.__calls['model.save'] = 1` forged a counter
    // (export-model-artifact's cheat went 8/9 -> 9/9); and
    // `tf.Tensor.prototype.arraySync = () => 'P'` poisoned every grader's
    // read path. All four routes are closed in both harnesses.
    const userCode = [
      "try { var __M = {}; Object.getOwnPropertyNames(Math).forEach(function(k) { if (k !== 'random') __M[k] = Math[k]; }); __M.random = function() { return 0.5; }; globalThis.Math = __M; } catch (e) {}",
      "const e1 = Math.random();",
      "const e2 = Math.random();",
      "try { tf.__calls['model.predict'] = 99; } catch (e) {}",
      "try { tf.Tensor.prototype.arraySync = function() { return 'P'; }; } catch (e) {}",
      "try { tf.util.createShuffledIndices = function() { return new Uint32Array([0]); }; } catch (e) {}",
      "const read = tf.tensor1d([1, 2]).arraySync();",
      "const shuffled = tf.util.createShuffledIndices(3);",
    ].join("\n");
    const testCode = [
      "it('every route is closed', function() {",
      "  expect(e1 === 0.5 && e2 === 0.5).toBe(false);",
      "  expect(e1 === e2).toBe(false);",
      "  expect(tf.__calls['model.predict'] || 0).toBe(0);",
      "  expect(Array.isArray(read) && read[0] === 1 && read[1] === 2).toBe(true);",
      "  expect(shuffled.length).toBe(3);",
      "});",
    ].join("\n");
    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].error).toBeUndefined();
    expect(results[0].passed).toBe(true);
  });

  it("keeps the grader's draws live against a submission that pins Math.random or tf's generator", async () => {
    // Round 7 (2026-09-13): `Math.random = () => 0.5` at the top of a
    // submission turned every run-time fixture in four graders into a
    // constant, because tf seeds its generator from Math.random on every
    // call. Math.random is now sealed per run and the tf namespace is
    // read-only, in both harnesses.
    const userCode = [
      "Math.random = () => 0.5;",
      "try { Object.defineProperty(Math, 'random', { value: () => 0.5 }); } catch (e) {}",
      "tf.randomUniform = () => tf.tensor1d([0.5]);",
      "const a = Math.random();",
      "const b = Math.random();",
      "const c = tf.randomUniform([1], 0, 1).dataSync()[0];",
      "const d = tf.randomUniform([1], 0, 1).dataSync()[0];",
    ].join("\n");
    const testCode = [
      "it('draws stay live', function() {",
      "  expect(a === 0.5 && b === 0.5).toBe(false);",
      "  expect(a === b).toBe(false);",
      "  expect(c === 0.5 && d === 0.5).toBe(false);",
      "  expect(c === d).toBe(false);",
      "  expect(typeof tf.randomUniform([2]).shape).toBe('object');",
      "});",
    ].join("\n");
    const { results } = await parseAndRunTests(userCode, testCode);
    expect(results).toHaveLength(1);
    expect(results[0].error).toBeUndefined();
    expect(results[0].passed).toBe(true);
  });
});
