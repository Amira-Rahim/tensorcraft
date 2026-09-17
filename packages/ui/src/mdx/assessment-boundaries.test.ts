// @vitest-environment node
import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseAndRunTests } from "./exercise-runner-node";
const exercises = JSON.parse(
  readFileSync("packages/content/.velite/exercises.json", "utf8"),
);
const cases: Array<[string, string]> = [
  [
    "ci-cd-gate",
    "it('missing labels cannot count as correct',()=>{const r=validateModelAccuracy([{}, {predicted:null,actual:null}],1);expect(r.correct).toBe(0);expect(r.passed).toBe(false);});",
  ],
  [
    "simple-attention",
    "it('keeps a one-feature value axis',()=>{const r=simpleAttention(tf.tensor1d([0]),tf.tensor2d([[1],[2]]),tf.tensor2d([[2],[4]]));expect(r.shape).toEqual([1]);expect(r.dataSync()[0]).toBeCloseTo(3,5);});",
  ],
  [
    "temporal-attention",
    "it('keeps a one-feature summary axis',()=>{const r=temporalAttention(tf.tensor2d([[2],[4]]),tf.zeros([2,1]));expect(r.summary.shape).toEqual([1]);});",
  ],
  [
    "quantize-weights",
    "it('constant kernels quantize without NaN',async()=>{const m=tf.sequential();m.add(tf.layers.dense({units:2,inputShape:[2],kernelInitializer:'zeros'}));const r=await quantizeModel(m,[[1,2]]);expect(r.kernels[0].quantized.every(Number.isFinite)).toBe(true);expect(r.maxWeightError).toBe(0);});",
  ],
  [
    "fft-features",
    "it('touching zero does not cross to the opposite side',()=>{expect(extractFeatures([1,0,1,0,-1,0,-1,0],8,1,3)[1]).toBe(0);});",
  ],
  [
    "llm-client",
    "it('rejects invalid confidence types and range',async()=>{for(const confidence of [null,'0.7',-0.1,1.1])await expect(analyzeSignal('x',async()=>JSON.stringify({classification:'noise',confidence,reasoning:'x'}))).rejects.toThrow();});",
  ],
  [
    "classify-anomaly",
    "it('an empty interval pattern is no evidence',()=>{expect(isFibonacciTrain([])).toBe(false);});",
  ],
  [
    "model-pipeline",
    "it('rejects a detector string instead of treating it as a boolean',async()=>{await expect(pipeline([],async()=>({class:'noise',confidence:0.5}),async()=> 'false',async()=> 'alert')).rejects.toThrow();});",
  ],
];
for (const [slug, checks] of cases) {
  it(slug + ": assessment boundary", { timeout: 30000 }, async () => {
    const exercise = exercises.find((e: { slug: string }) => e.slug === slug);
    const result = await parseAndRunTests(exercise.solutionCode, checks, 20000);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.filter((r) => !r.passed)).toEqual([]);
  });
}

for (const [name, from, to] of [
  [
    "equivalent role wording",
    "a signal classifier",
    "an assistant that labels signals",
  ],
  [
    "JSON request without surrounding prose",
    "Respond in JSON with fields:",
    "Return JSON without prose, with fields:",
  ],
]) {
  it(`prompt-template accepts ${name}`, { timeout: 30_000 }, async () => {
    const exercise = exercises.find(
      (e: { slug: string }) => e.slug === "prompt-template",
    );
    const alternative = exercise.solutionCode.replace(from, to);
    expect(alternative).not.toBe(exercise.solutionCode);
    const result = await parseAndRunTests(
      alternative,
      exercise.testCode,
      20_000,
    );
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.filter((r) => !r.passed)).toEqual([]);
  });
}
