// Execute the actual MDX code strings selected during the internal review.
// Integration sketches and deliberately broken examples have separate scope.
// Optional filters: REVIEW_MODULE=foundations or REVIEW_LESSON=tensor-shapes.
import { readFile } from "node:fs/promises";
import { transformWithEsbuild } from "vite";
import assert from "node:assert/strict";
import * as tf from "@tensorflow/tfjs";

await tf.setBackend("cpu");
const base = new URL(
  "../packages/content/content/deep-orbit/",
  import.meta.url,
);
function codeBlocks(source) {
  return [
    ...source.matchAll(
      /<CodeBlock language="(?:typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].map(([, title, template]) => ({
    title,
    code: new Function("return `" + template + "`;")(),
  }));
}
let reviewedRuns = 0;
async function run(path, titles, prefix = "", suffix = "") {
  if (
    process.env.REVIEW_MODULE &&
    !path.startsWith(process.env.REVIEW_MODULE + "/")
  )
    return;
  if (
    process.env.REVIEW_LESSON &&
    !path.endsWith(`-${process.env.REVIEW_LESSON}.mdx`)
  )
    return;
  const blocks = codeBlocks(await readFile(new URL(path, base), "utf8"));
  const selected = titles.map((title) => {
    const block = blocks.find((b) => b.title === title);
    assert.ok(block, `Missing reviewed block ${path}: ${title}`);
    return block.code.replace(/^import .*?;\s*$/gm, "");
  });
  const { code } = await transformWithEsbuild(
    prefix + selected.join("\n") + suffix,
    "reviewed-example.ts",
    { loader: "ts", target: "es2022" },
  );
  const count = tf.memory().numTensors;
  const fn = new Function(
    "tf",
    "console",
    "assert",
    "return (async () => {\n" + code + "\n})();",
  );
  await fn(tf, { log() {}, warn() {}, table() {} }, assert);
  assert.equal(
    tf.memory().numTensors,
    count,
    `${path}: unreleased example tensors`,
  );
  reviewedRuns++;
  console.log(`PASS ${path}: ${titles.join(", ")}`);
}

await run(
  "foundations/01-introduction-to-tensors.mdx",
  ["inspect-a-packet.ts"],
  "",
  `
assert.deepEqual(shape, [3]);
assert.ok(Math.abs(total - 1.1) < 1e-6);
assert.ok(values.every((value, i) => Math.abs(value - streamValues[i]) < 1e-6));
`,
);
await run("foundations/01-introduction-to-tensors.mdx", [
  "tensors-are-arrays.ts",
  "tensor-memory.ts",
]);
await run(
  "foundations/02-tensor-shapes.mdx",
  ["arrange-readings.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  `
assert.deepEqual(flat.shape, [12]);
assert.deepEqual(grid.shape, [3, 4]);
assert.deepEqual(bySensor.shape, [4, 3]);
assert.deepEqual(step1, [3, 18, 7, 8]);
assert.deepEqual(captured, [
  [[2, 20, 5, 8], [3, 18, 7, 8], [4, 16, 6, 9]],
  [3, 18, 7, 8],
  [[2, 3, 4], [20, 18, 16], [5, 7, 6], [8, 8, 9]],
]);
`,
);
await run(
  "foundations/03-tensor-operations.mdx",
  ["tensor-ops.ts"],
  "const gains = tf.ones([1, 64]); const readings = tf.ones([1, 64]);\n",
);
await run("foundations/03-tensor-operations.mdx", ["matmul.ts"]);
await run(
  "foundations/04-data-loading.mdx",
  ["data-pipeline.ts"],
  "async function readArchivedSample(i) { return { features: [i, i / 10, 0], label: i % 2 }; }\n",
);
await run("foundations/05-normalization.mdx", [
  "normalization.ts",
  "preview-neuron.ts",
]);
await run("neural-networks/01-first-neuron.mdx", ["first-neuron.ts"]);
await run("neural-networks/02-activation-functions.mdx", [
  "collapse.ts",
  "activations.ts",
]);
await run("neural-networks/03-layers-and-architecture.mdx", [
  "layer-architecture.ts",
]);
await run("neural-networks/04-forward-pass.mdx", [
  "forward-pass.ts",
  "by-hand.ts",
]);
await run("neural-networks/05-building-a-network.mdx", ["complete-network.ts"]);
await run("training-loop/01-loss-functions.mdx", ["loss-functions.ts"]);
await run("training-loop/02-gradient-descent.mdx", ["gradient-descent.ts"]);
await run("training-loop/03-backpropagation.mdx", ["backpropagation.ts"]);
const training = codeBlocks(
  await readFile(new URL("training-loop/04-training-loop.mdx", base), "utf8"),
)
  .filter(({ title }) =>
    ["training-loop.ts", "early-stopping.ts"].includes(title),
  )
  .map(({ code }) => code.replace(/^import .*?;\s*$/gm, ""))
  .join("\n");
await run(
  "training-loop/05-evaluating-deep-scan.mdx",
  ["evaluation.ts"],
  training + "\n",
);

await run(
  "browser-runtimes/04-inference-pipeline.mdx",
  ["inference-pipeline.ts", "classify-async.ts"],
  "",
  `
const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [3], useBias: false }));
tf.tidy(() => model.setWeights([tf.tensor2d([[1], [0], [0]])]));
const signal = { amplitude: 1536, frequency: 0, phase: 0 };
assert.deepEqual(classify(model, signal), { class: 'anomaly', confidence: 0.75 });
assert.deepEqual(await classifyAsync(model, signal), { class: 'anomaly', confidence: 0.75 });
model.dispose();
`,
);

const firstSignal = codeBlocks(
  await readFile(
    new URL("signal-processing/01-time-vs-frequency.mdx", base),
    "utf8",
  ),
)
  .map(({ code }) => code.replace(/^import .*?;\s*$/gm, ""))
  .join("\n");
await run(
  "signal-processing/02-fourier-transform.mdx",
  ["fft-basics.ts", "fft-interpretation.ts", "deep-scan-fft.ts"],
  firstSignal + "\n",
  `
assert.ok(Math.abs(magArray[5] - 64) < 1e-4);
assert.ok(Math.abs(magArray[20] - 19.2) < 1e-4);
assert.equal(analyzeSignal(anomalousSignal, 256).at(-1).frequency, 73.5);
assert.equal(visibleBins(onBin), 1);
assert.equal(visibleBins(betweenBins), 33);
`,
);
await run(
  "signal-processing/03-spectrograms.mdx",
  ["stft.ts", "reading-spectrogram.ts", "window-tradeoff.ts"],
  "",
  `
assert.deepEqual(activeWindows, [2, 6]);
assert.equal(spec.length, 7);
assert.equal(spec[0].length, 129);
`,
);
await run(
  "signal-processing/05-windowing-and-overlap.mdx",
  ["spectral-leakage.ts", "window-functions.ts", "overlap.ts"],
  "",
  `
assert.ok(windowedFFT[20] < rawFFT[20] / 10);
assert.equal(spec.length, 3);
assert.equal(spec[0].length, 33);
`,
);
await run(
  "signal-processing/04-fft-as-features.mdx",
  ["feature-engineering.ts", "normalization.ts", "enhanced-model.ts"],
  `
const signalSamples = Array.from({ length: 64 }, (_, i) => Math.sin(2 * Math.PI * 52 * i / 256));
// Integration fixture: separate rows for train, validation and test.
const makeRows = (start, count) => Array.from({ length: count }, (_, i) => Array.from({ length: 11 }, (_, j) => Math.sin((i + start) * (j + 1))));
const trainingFeatures = makeRows(0, 40), validationFeatures = makeRows(40, 10), testFeatures = makeRows(50, 10);
const trainY = tf.zeros([40, 1]), validationY = tf.zeros([10, 1]), testY = tf.zeros([10, 1]);
`,
  `
assert.equal(extractFeatures(signalSamples).length, 11);
assert.throws(() => extractFeatures(signalSamples, 32));
assert.throws(() => normalizeFeatures([]));
const constantFeatures = normalizeFeatures([[5, 1], [5, 3]]);
assert.equal(constantFeatures.stats[0].std, 0);
assert.deepEqual(constantFeatures.normalized, [[0, -1], [0, 1]]);
assert.deepEqual(normalizeWithStats([7, 5], constantFeatures.stats), [2, 3]);
tf.dispose([trainY, validationY, testY]);
`,
);
await run("recurrent-networks/01-sequences-matter.mdx", [
  "feedforward-limitation.ts",
  "sequence-tensors.ts",
]);
await run("recurrent-networks/02-simple-rnns.mdx", [
  "reducer-with-memory.ts",
  "rnn-as-reducer.ts",
  "rnn-unrolled.ts",
]);
await run("recurrent-networks/03-lstm-gates.mdx", [
  "lstm-model.ts",
  "gru-comparison.ts",
]);
await run(
  "recurrent-networks/04-sliding-windows.mdx",
  ["the-mirror.ts", "sliding-window.ts", "streaming-buffer.ts"],
  `
let listener;
const signalFeed = { addEventListener(_name, fn) { listener = fn; } };
const rendered = [];
function updateDashboard(result) { rendered.push(result); }
const model = { predict(input) { return input.mean([1, 2]).expandDims(1); } };
`,
  `
assert.equal((100 * accuracy(evalA, trainA)).toFixed(1), '97.4');
assert.equal((100 * accuracy(evalB, trainB)).toFixed(1), '60.6');
for (let i = 0; i < 80; i++) listener({ detail: { features: [i, i+1, i+2] } });
assert.equal(rendered.length, 1);
assert.equal(rendered[0][0], 40.5);
assert.throws(() => new SignalBuffer(0));
`,
);

const forecastingSolution = (
  await readFile(
    new URL("recurrent-networks/exercises/predict-next.yaml", base),
    "utf8",
  )
)
  .split("solutionCode: |\n")[1]
  .split("testCode:")[0]
  .replace(/^  /gm, "");
const rolloutFunction = forecastingSolution.slice(
  forecastingSolution.indexOf("function forecastMultiStep"),
);
await run(
  "recurrent-networks/05-sequence-prediction.mdx",
  ["prediction-model.ts", "multi-step.ts"],
  rolloutFunction +
    `
const trainX = tf.zeros([4, 80, 3]), trainY = tf.zeros([4, 3]);
const validationX = tf.zeros([2, 80, 3]), validationY = tf.zeros([2, 3]);
`,
  `
assert.equal(forecast.length, 47);
assert.ok(forecast.every(row => row.length === 3 && row.every(Number.isFinite)));
tf.dispose([trainX, trainY, validationX, validationY]);
`,
);

await run(
  "anomaly-detection/01-normal-vs-anomalous.mdx",
  ["baseline-stats.ts", "precision-recall.ts"],
  "",
  `
assert.equal(isAnomaly(1, baseline), true);
assert.equal(isAnomaly(0.55, baseline), false);
assert.throws(() => computeBaseline([]));
assert.equal(precision({ truePositives: 0, falsePositives: 0, falseNegatives: 0 }), null);
assert.equal(isAnomaly(0.1, { mean: 0.1, std: 0, p5: 0.1, p95: 0.1 }), false);
`,
);
await run(
  "anomaly-detection/02-autoencoders.mdx",
  ["autoencoder.ts", "training.ts"],
  `
// Separate explicit integration fixtures, not spacecraft data.
const normalSignals = tf.zeros([8, 11]), normalValidation = tf.zeros([4, 11]);
`,
  `
assert.equal(history.history.loss.length, 100);
autoencoder.dispose();
tf.dispose([normalSignals, normalValidation]);
`,
);
await run(
  "anomaly-detection/03-reconstruction-error.mdx",
  [
    "reconstruction-error.ts",
    "reconstruction-counterexample.js",
    "feature-errors.ts",
  ],
  `
const autoencoder = tf.sequential();
autoencoder.add(tf.layers.dense({ inputShape: [11], units: 11, kernelInitializer: 'zeros', biasInitializer: 'zeros' }));
const normalTestData = tf.ones([4, 11]), anomalousData = tf.fill([1, 11], 2);
const anomalyTensor = anomalousData;
`,
  `
assert.deepEqual(normalScores, [1, 1, 1, 1]);
assert.deepEqual(anomalyScores, [4]);
assert.equal(distantAnomalyError, 0);
assert.ok(Math.abs(ordinaryNoisyError - 0.02) < 1e-10);
assert.ok(relativeFeatureErrors(autoencoder, anomalousData, normalTestData, Array.from({length: 11}, (_, i) => String(i))).every(row => row.ratio === 4));
const zeros = tf.zeros([2, 11]);
assert.ok(relativeFeatureErrors(autoencoder, anomalousData, zeros, Array.from({length: 11}, (_, i) => String(i))).every(row => Number.isFinite(row.ratio)));
tf.dispose([normalTestData, anomalousData, zeros]); autoencoder.dispose();
`,
);
await run(
  "anomaly-detection/04-threshold-tuning.mdx",
  [
    "threshold-setting.ts",
    "evaluation.ts",
    "f1-and-cost.js",
    "locked-threshold.ts",
  ],
  `
const autoencoder = {}, validationData = {};
const computeAnomalyScores = () => [0.1, 0.2, 0.3, 0.4];
const valErrors = [0.1, 0.4, 1.1, 2], valLabels = [false, true, false, true];
const testErrors = [0.05, 0.3, 1.2, 2.1], testLabels = [false, false, true, true];
`,
  `
assert.equal(percentile([4, 1, 3, 2], 50), 2);
assert.throws(() => percentile([], 99));
assert.equal(held.f1, 1);
assert.ok(comparisons[0].f1 < comparisons[1].f1);
assert.ok(comparisons[0].equalCost < comparisons[1].equalCost);
`,
);
await run(
  "anomaly-detection/05-the-anomaly.mdx",
  ["ensemble-detector.ts"],
  "",
  `
const autoencoder = tf.sequential();
autoencoder.add(tf.layers.dense({ inputShape: [11], units: 11, kernelInitializer: 'zeros', biasInitializer: 'zeros' }));
const lstm = { predict: input => tf.ones([input.shape[0], 3]) };
const result = detectAnomaly(Array(11).fill(2), [1, 1, 1], 0.52, { mean: 0.52, std: 0.15 }, autoencoder, lstm, [[0, 0, 0]], { zScore: 3, reconstruction: 1, prediction: 0.01 });
assert.equal(result.detectors.lstm.predictionError, 0, 'Use the LSTM-scaled target, not autoencoder columns');
assert.equal(result.agreement, 1);
assert.equal(result.isAnomaly, false);
const detectorArgs = (ae, forecast) => [Array(11).fill(2), [1, 1, 1], 0.52, { mean: 0.52, std: 0.15 }, ae, forecast, [[0, 0, 0]], { zScore: 3, reconstruction: 1, prediction: 0.01 }];
const beforeInvalid = tf.memory().numTensors;
assert.throws(() => detectAnomaly(...detectorArgs({ predict: () => tf.fill([1, 11], NaN) }, lstm)), /Invalid reconstruction score/);
assert.throws(() => detectAnomaly(...detectorArgs({ predict: () => tf.zeros([1, 1]) }, lstm)), /Invalid reconstruction shape/);
assert.throws(() => detectAnomaly(...detectorArgs(autoencoder, { predict: () => tf.fill([1, 3], NaN) })), /Invalid forecast score/);
assert.throws(() => detectAnomaly(...detectorArgs(autoencoder, { predict: () => tf.zeros([1, 2]) })), /Invalid forecast shape/);
assert.equal(tf.memory().numTensors, beforeInvalid);
autoencoder.dispose();
`,
);

await run(
  "advanced-time-series/01-beyond-lstm.mdx",
  ["attention-basics.ts", "comparison.ts"],
  "",
  `
tf.tidy(() => {
  const { output, weights } = simpleAttention(tf.zeros([1, 2]), tf.ones([2, 2]), tf.tensor2d([[2], [4]]));
  assert.deepEqual(output.arraySync(), [[3]]);
  assert.deepEqual(weights.arraySync(), [[0.5, 0.5]]);
});
`,
);
await run(
  "advanced-time-series/02-temporal-attention.mdx",
  [
    "temporal-attention.ts",
    "interpret-attention.ts",
    "ring-buffer-attention.ts",
    "positional-feature.ts",
  ],
  `
function bufferWindow() { return tf.ones([1, 80, 3]); }
`,
  `
tf.tidy(() => {
  const input = tf.tensor3d([[[2], [4]]]);
  positionalAttention(input); // build weights, then choose an exact fixture
  positionalScorer.setWeights([tf.tensor2d([[0], [2]]), tf.zeros([1])]);
  const result = positionalAttention(input);
  assert.ok(result.attended.dataSync()[0] > 3.7);
  const single = withPosition(tf.ones([1, 1, 3]));
  assert.deepEqual(single.arraySync(), [[[1, 1, 1, 0]]]);
});
scorer.dispose(); positionalScorer.dispose();
`,
);
await run(
  "advanced-time-series/03-forecasting.mdx",
  ["forecasting.ts", "non-stationary.ts", "error-by-horizon.ts"],
  `
const savedScaler = { mean: [1024, 32, 0], std: [512, 16, 1] };
const model = { predict: input => tf.zeros([input.shape[0], 3]) };
const recentWindow = Array.from({length: 80}, () => [0, 0, 0]);
const observedReadings = Array.from({length: 400}, (_, i) => [i / 400, 0, 0]);
`,
  `
assert.equal(predictions.length, 100);
assert.ok(errorsByHorizon.every(row => row.replay <= 0.0002500001));
assert.ok(errorsByHorizon.some(row => row.rollout > 0.05));
assert.equal(detectDrift([[0], [0]], [[0], [1]], 1).driftMagnitude, null);
assert.throws(() => detectDrift([[0]], [[0]], 0));
`,
);
await run(
  "advanced-time-series/04-kalman-filters.mdx",
  ["ema-two-alphas.ts", "kalman-filter.ts"],
  "",
  `
assert.ok(Math.abs(smooth(0.2) - 72.56664064) < 1e-5);
assert.ok(Math.abs(kf.update(72).estimate - 72.3136) < 0.001);
assert.throws(() => new KalmanFilter(0, -1, 1));
`,
);
await run(
  "advanced-time-series/05-ensemble-methods.mdx",
  ["ensemble.ts", "mae-is-not-variance.js"],
  `
const heldOutWindows = [1, 2, 3, 4], heldOutTargets = [2, 3, 4, 5];
const members = [1, 2, 3].map(offset => ({ predictScalar: value => value + offset }));
`,
  `
assert.ok(Math.abs(avg[0] - 1120) < 1e-8);
assert.ok(Math.abs(weighted[0] - 1117.32) < 1e-8);
assert.deepEqual(biased, { mae: 1, variance: 0 });
assert.deepEqual(varying, { mae: 1, variance: 1 });
assert.throws(() => weightedEnsemble([]));
assert.deepEqual(weightedEnsemble([
  { modelName: "A", prediction: [2], weight: 1e308 },
  { modelName: "B", prediction: [4], weight: 1e308 },
]), [3]);
`,
);

await run(
  "llm-integration/01-llms-for-science.mdx",
  ["llm-client.ts", "workflow.ts"],
  `
// Controlled HTTP boundary, not a live provider call.
const API_KEY = 'test-only', BASE_URL = 'https://example.invalid/', MODEL_ID = 'fixture-model';
let responseMode = 'ok', requests = [];
const fetch = async (url, options) => {
  requests.push({url, options});
  return { ok: responseMode !== 'http', status: 503,
    json: async () => responseMode === 'shape' ? {} : { choices: [{message: {content: 'Draft fixture'}}] } };
};
`,
  `
assert.equal(requests[0].url, 'https://example.invalid/v1/chat/completions');
assert.equal(JSON.parse(requests[0].options.body).model, MODEL_ID);
assert.ok(requests[0].options.signal instanceof AbortSignal);
assert.equal(report, 'Draft fixture');
responseMode = 'http'; await assert.rejects(llm.complete('x'), /HTTP 503/);
responseMode = 'shape'; await assert.rejects(llm.complete('x'), /Missing text/);
assert.deepEqual(check.matched, [12001, 153, 1]); assert.deepEqual(check.unmatched, [9]);
`,
);
await run(
  "llm-integration/02-prompt-engineering.mdx",
  ["templates.ts"],
  "",
  `
assert.equal(parseClassification('prefix {"classification":"unknown","confidence":0,"reasoning":"Missing records","risk_level":"low"} suffix').confidence, 0);
for (const bad of [{classification:'noise',confidence:'0.8',reasoning:'x',risk_level:'low'},
{classification:'noise',confidence:0.8,reasoning:' ',risk_level:'low'},
{classification:'noise',confidence:0.8,reasoning:'x',risk_level:'extreme'}]) {
  assert.throws(() => parseClassification(JSON.stringify(bad)));
}
assert.match(classificationPrompt({amplitude:1024,frequency:73.4,phase:0.23}), /73.4 Hz/);
`,
);
const exerciseSolution = async (slug) =>
  (
    await readFile(
      new URL("llm-integration/exercises/" + slug + ".yaml", base),
      "utf8",
    )
  )
    .split("solutionCode: |\n")[1]
    .split("testCode:")[0]
    .replace(/^  /gm, "");
const retrievalCode = await exerciseSolution("retrieve-signals");
const verificationCode = await exerciseSolution("rag-pipeline");
await run(
  "llm-integration/03-rag-for-signals.mdx",
  ["rag-pipeline.ts"],
  retrievalCode.replace("const CONTEXT_ROWS = 20;", "") +
    "\n" +
    verificationCode +
    `
const signalDatabase = [{ id: 'a', band:'7', classification:'anomaly', frequency:73.4, timestamp:new Date().toISOString() }];
const llm = { complete: async () => JSON.stringify([{id:'claim',kind:'reading',rowIds:['a'],field:'frequencyHz',value:73.4,unit:'Hz'}]) };
`,
  `
assert.deepEqual(result.verified, ['claim']); assert.equal(result.matched, 1);
await assert.rejects(querySignals('band-7', signalDatabase, {complete:async () => '[null]'}));
const now = Date.now();
assert.equal(retrieveSignals('24 hours', [{...signalDatabase[0],timestamp:new Date(now+1).toISOString()}], now).matched, 0);
`,
);
await run(
  "llm-integration/04-report-generation.mdx",
  ["report-pipeline.ts"],
  `
const anomalyDataSummary = 'Fictional fixture: 73.4 Hz';
const llm = { complete: async () => 'Draft with source review pending' };
const reviewSection = async ({heading}) => heading === 'Executive Summary';
`,
  `
assert.equal(marked[0].validated, true); assert.equal(marked[1].validated, false);
assert.equal(reportSections[0].generated, undefined);
const previous = [{heading:'Old',prompt:'Short',data:'1 event',generated:'Old draft',validated:true}];
const next = await generateReport(previous, llm, async () => false);
assert.equal(previous[0].generated, 'Old draft'); assert.equal(next[0].validated, false);
await assert.rejects(generateReport(previous, {complete:async () => {throw new Error('offline');}}, async () => true));
assert.equal(previous[0].generated, 'Old draft');
const ambiguous = await generateReport(previous, llm, async () => 'yes'); assert.equal(ambiguous[0].validated, false);
`,
);
await run(
  "llm-integration/05-multi-model-systems.mdx",
  ["pipeline.ts", "resilience.ts"],
  "",
  `
// Real TFJS tensors; controlled predictions isolate orchestration contracts.
const features = [1, 0.5, 0.5], signal = Array(11).fill(1), window = Array.from({length:80}, () => [0,0,0]);
const models = { classifier:{predict:() => tf.tensor2d([[0.8]])}, autoencoder:{predict:x=>tf.zerosLike(x)},
 lstm:{predict:()=>tf.tensor2d([[0,0,0]])}, llm:{complete:async ()=>'Unreviewed fixture draft'} };
const r = await processSignal(features, signal, window, models, {anomaly:0.5});
assert.equal(r.anomaly.method, 'autoencoder-mse'); assert.equal(r.anomaly.score, 1);
assert.match(r.report, /autoencoder-mse/); assert.equal(r.draftForReview, 'Unreviewed fixture draft');
models.autoencoder.predict = () => { throw new Error('unavailable'); };
models.lstm.predict = () => { throw new Error('unavailable'); };
models.llm.complete = async () => { throw new Error('unavailable'); };
const fallback = await resilientPipeline(features, signal, window, models, {anomaly:0.5}, {mean:0.52,std:0.15});
assert.equal(fallback.anomaly.method, 'amplitude-z-score'); assert.ok(Math.abs(fallback.anomaly.score-3.2)<1e-8);
assert.match(fallback.report, /amplitude only/); assert.match(fallback.report, /Forecast unavailable/);
assert.equal(fallback.draftForReview, null);
await assert.rejects(resilientPipeline(features, signal, window, models, {anomaly:0.5}, {mean:0.52,std:0}));
models.classifier.predict = () => tf.tensor2d([[NaN]]);
await assert.rejects(processSignal(features, signal, window, models, {anomaly:0.5}));
`,
);

await run(
  "optimization-edge/01-model-profiling.mdx",
  ["profiling.ts"],
  `
// Small embedding fixture with the displayed token-input contract, not the fictional language model.
const model = tf.sequential();
model.add(tf.layers.embedding({inputDim:50000,outputDim:1,inputLength:80}));
model.add(tf.layers.flatten()); model.add(tf.layers.dense({units:1}));
`,
  `
assert.equal(profile.parameterCount, 50081);
assert.equal(profile.layerBreakdown.length, 3);
assert.ok(profile.inferenceMeanMs >= 0); model.dispose();
const input = tf.zeros([1,1]);
await assert.rejects(profileModel({countParams:()=>0,layers:[],predict:()=>{throw new Error('failed');}}, ()=>input));
assert.equal(input.isDisposed, true);
`,
);
await run(
  "optimization-edge/02-quantization.mdx",
  ["quantization.ts"],
  "",
  `
const source = new Float32Array([-1, -0.12, 0.7, 1]);
for (const bits of [8,16]) {
 const q = quantizeWeights(source,bits); const decoded = dequantize(q.quantized,q.scale,q.min);
 assert.ok(decoded.every((v,i) => Math.abs(v-source[i]) <= q.scale/2+1e-12));
}
assert.throws(()=>quantizeWeights(new Float32Array([]),8));
const constant = quantizeWeights(new Float32Array([3,3]),8);
assert.deepEqual(dequantize(constant.quantized,constant.scale,constant.min),[3,3]);
`,
);
await run(
  "optimization-edge/03-pruning.mdx",
  ["pruning.ts"],
  "",
  `
assert.deepEqual(pruneWeights([1,2],1),[0,0]); assert.deepEqual(pruneWeights([],0.5),[]);
assert.deepEqual(pruneWeights([1,2],0),[1,2]); assert.throws(()=>pruneWeights([1],2));
`,
);
await run(
  "optimization-edge/04-caching-strategies.mdx",
  ["inference-cache.ts"],
  `
let now = 1000; const Date = {now:()=>now};
let calls = 0; const model = {}; function classify() {calls++;return 'noise';}
`,
  `
const lru = new InferenceCache(JSON.stringify,2,100);
lru.set([1],'a');lru.set([2],'b');assert.equal(lru.get([1]),'a');lru.set([3],'c');
assert.equal(lru.get([2]),null); now += 101;assert.equal(lru.get([1]),null);
cachedClassify([1]);cachedClassify([1]);assert.equal(calls,1);
`,
);
await run(
  "capstone/01-system-architecture.mdx",
  ["registry.ts"],
  "",
  `
assert.equal(validateGraph(manifest),true);
assert.equal(validateGraph([{name:'a',dependencies:['missing']}]),false);
// A cycle passes this limited name-resolution check, as the lesson states.
assert.equal(validateGraph([{name:'a',dependencies:['b']},{name:'b',dependencies:['a']}]),true);
`,
);
await run(
  "capstone/03-monitoring.mdx",
  ["monitor.ts", "drift.ts"],
  `
const trainingFeatures = [Array(11).fill(0)], signalFeatures = Array(11).fill(1);
const trainingData = trainingFeatures, recentSignals = [signalFeatures];
`,
  `
assert.equal(monitor.getLatencyPercentile(95),5.2);assert.equal(monitor.avgConfidence,0.94);
assert.ok(drift.thresholdExceeded);assert.equal(drift.driftScore,Math.sqrt(11));
const fresh = new ModelMonitor([[0]]);assert.equal(fresh.avgConfidence,null);
for(let i=0;i<1001;i++) fresh.log({timestamp:i,confidence:0.8,latencyMs:i,inputFeatures:[0],label:'a'});
assert.equal(fresh.logs.length,1000);assert.equal(fresh.getLatencyPercentile(95),950);
assert.throws(()=>fresh.log({timestamp:0,confidence:NaN,latencyMs:0,inputFeatures:[0],label:'a'}));
assert.throws(()=>detectDrift([],recentSignals,0.5));
const snapshot = fresh.logs;snapshot[0].inputFeatures[0]=99;assert.equal(fresh.logs[0].inputFeatures[0],0);
`,
);
await run(
  "capstone/04-documentation.mdx",
  ["model-card.ts"],
  "",
  `
assert.equal(deepScanCard.performance.weightBytes,997*4);
assert.ok(deepScanCard.limitations.length >= 5);
`,
);
await run(
  "capstone/05-launch.mdx",
  ["deploy.ts"],
  `
let clock = 0; const performance = {now:()=>clock++};
`,
  `
let disposed=0,loaded=0,calls=0;
const load = async (url) => {loaded++;assert.equal(url,'https://example.invalid/release');return {
 classify:async input=>{calls++;return {label:input[0]>0?'anomaly':'noise'};},dispose:()=>{disposed++;}};};
const probes = [{input:Array(64).fill(1),label:'anomaly'},{input:Array(64).fill(0),label:'noise'}];
const signal = new AbortController().signal;
const result = await verifyHostedPipeline('https://example.invalid/release',load,probes,{minAccuracy:1,p95Ms:2},signal);
assert.deepEqual(result,{passed:true,accuracy:1,p95Ms:1});assert.equal(calls,112);assert.equal(disposed,1);
const slow = await verifyHostedPipeline('https://example.invalid/release',load,probes,{minAccuracy:1,p95Ms:0.5},signal);assert.equal(slow.passed,false);
await assert.rejects(verifyHostedPipeline('x',async()=>({classify:async()=>{throw new Error('bad');},dispose:()=>{disposed++;}}),probes,{minAccuracy:1,p95Ms:2},signal));
assert.equal(disposed,3);
await assert.rejects(verifyHostedPipeline('x',load,[],{minAccuracy:1,p95Ms:2},signal));
for (const invalidAt of [probes.length + 1, probes.length + 11]) {
  let calls = 0, releases = 0;
  await assert.rejects(verifyHostedPipeline('x',async()=>({
    classify:async()=>({label: ++calls === invalidAt ? '' : 'signal'}),
    dispose:()=>{releases++;},
  }),probes,{minAccuracy:1,p95Ms:2},signal), /Invalid prediction/);
  assert.equal(releases, 1);
}
const controller = new AbortController();
let cancellationCalls = 0, cancellationReleases = 0;
await assert.rejects(verifyHostedPipeline('x',async()=>({
  classify:async()=>{if (++cancellationCalls === probes.length) controller.abort(); return {label:'signal'};},
  dispose:()=>{cancellationReleases++;},
}),probes,{minAccuracy:1,p95Ms:2},controller.signal));
assert.equal(cancellationCalls, probes.length);
assert.equal(cancellationReleases, 1);

assert.equal(loaded,2);
`,
);

assert.ok(
  reviewedRuns > 0,
  "No reviewed code blocks matched the requested filters",
);
