// Execute the actual MDX code strings selected during the internal review.
// Integration sketches and deliberately broken examples have separate scope.
// Optional filters: REVIEW_MODULE=foundations or REVIEW_LESSON=tensor-shapes.
import { readFile } from "node:fs/promises";
import { transformWithEsbuild } from "vite";
import assert from "node:assert/strict";
import * as tf from "@tensorflow/tfjs";
import { Tensor as OnnxTensor } from "onnxruntime-web";

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
async function run(
  path,
  titles,
  prefix = "",
  suffix = "",
  authoredBlocks,
  review = {},
) {
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
  const blocks =
    authoredBlocks ?? codeBlocks(await readFile(new URL(path, base), "utf8"));
  const selected = titles.map((title) => {
    const block = blocks.find((b) => b.title === title);
    assert.ok(block, `Missing reviewed block ${path}: ${title}`);
    return block.code.replace(/^import .*?;\s*$/gm, "");
  });
  const { code } = await transformWithEsbuild(
    prefix + "\n" + selected.join("\n") + "\n" + suffix,
    "reviewed-example.ts",
    { loader: "ts", target: "es2022" },
  );
  const count = tf.memory().numTensors;
  const fn = new Function(
    "tf",
    "console",
    "assert",
    "review",
    "return (async () => {\n" + code + "\n})();",
  );
  await fn(tf, { log() {}, warn() {}, table() {} }, assert, review);
  assert.equal(
    tf.memory().numTensors,
    count,
    `${path}: unreleased example tensors`,
  );
  reviewedRuns++;
  console.log(`PASS ${path}: ${titles.join(", ")}`);
}

// Lesson one now executes its worked example inside the live workbench.
// Exercise that actual function body with the same pinned TFJS namespace.
const tensorExampleSource = await readFile(
  new URL(
    "../apps/web/app/components/lesson-visuals/tensor-example.ts",
    import.meta.url,
  ),
  "utf8",
);
assert.ok(
  tensorExampleSource.includes('const tf = await import("@tensorflow/tfjs");'),
);
await run(
  "foundations/01-introduction-to-tensors.mdx",
  ["runTensorExample (active workbench)"],
  "",
  `
const streamValues = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];
const actual = await runTensorExample(streamValues);
assert.deepEqual(actual.shape, [12]);
assert.deepEqual(actual.values, streamValues);
assert.deepEqual(actual.chartRows, [[2,3,4],[20,18,16],[5,7,6],[8,8,9]]);
`,
  [
    {
      title: "runTensorExample (active workbench)",
      code: tensorExampleSource
        .replace("export async function", "async function")
        .replace('const tf = await import("@tensorflow/tfjs");', ""),
    },
  ],
);
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
  ["merge-two-passes.ts", "weighted-channel-mix.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  `
assert.deepEqual(captured, [
  [[2.5, 19], [3.5, 17]],
  [[5, 38], [7, 34]],
  [[5, 38, 43], [7, 34, 41]],
]);
`,
);
await run(
  "foundations/03-tensor-operations.mdx",
  ["broadcast-recording-reference.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  "assert.deepEqual(captured, [[[2, 20], [2.5, 19]]]);\n",
);
await run(
  "foundations/03-tensor-operations.mdx",
  ["tensor-ops.ts"],
  "const gains = tf.ones([1, 64]); const readings = tf.ones([1, 64]);\n",
);
await run("foundations/03-tensor-operations.mdx", ["matmul.ts"]);
await run(
  "foundations/04-data-loading.mdx",
  [
    "practice-reader.ts",
    "one-sample.ts",
    "first-read.ts",
    "batch-and-read.ts",
    "split-membership.ts",
  ],
  "",
  `
assert.equal(readCount, 16);
assert.deepEqual(batchShapes, [[4, 3], [4, 3], [4, 3], [4, 3]]);
assert.deepEqual(trainIdx.slice().sort((a, b) => a - b), Array.from({length:12}, (_, i) => i));
assert.deepEqual(valIdx, [12, 13, 14, 15]);
`,
);
await run(
  "foundations/04-data-loading.mdx",
  ["data-pipeline.ts"],
  "async function readArchivedSample(i) { return { features: [i, i / 10, 0], label: i % 2 }; }\n",
);
await run(
  "foundations/05-normalization.mdx",
  [
    "fit-and-scale.ts",
    "supplied-preview-neuron.ts",
    "score-the-scaled-input.ts",
    "min-max-columns.ts",
  ],
  "const batch = tf.tensor2d([[20, 0.2], [22, 0.8], [24, 0.4], [26, 0.6]]);\n",
  `
assert.deepEqual(mean.shape, [2]);
assert.ok(Math.abs(mean.dataSync()[0] - 23) < 1e-6);
assert.ok(Math.abs(mean.dataSync()[1] - 0.5) < 1e-6);
assert.ok(Math.abs(std.dataSync()[0] - Math.sqrt(5)) < 1e-6);
assert.ok(Math.abs(std.dataSync()[1] - Math.sqrt(0.05)) < 1e-6);
assert.deepEqual(scores.shape, [4, 1]);
assert.ok(Math.abs(oneValue - 0.6745) < 0.001);
assert.deepEqual(unitRange.shape, [4, 2]);
assert.ok(Math.abs(unitRange.arraySync()[2][0] - 2/3) < 1e-6);
const expectedScores = [0.5917, 0.0704, 0.6745, 0.5699];
assert.ok(Array.from(scores.dataSync()).every((value, i) => Math.abs(value - expectedScores[i]) < 0.001));
tf.dispose([batch, mean, std, normalized, scores, min, max, unitRange]);
previewModel.dispose();
`,
);
await run(
  "neural-networks/01-first-neuron.mdx",
  ["first-neuron.ts"],
  "const captured = []; console.log = value => captured.push(ArrayBuffer.isView(value) ? Array.from(value) : value);\n",
  `
assert.ok(Math.abs(captured[0][0] - 0.26) < 1e-6);
assert.ok(Math.abs(captured[1] - 0.26) < 1e-12);
`,
);
await run(
  "neural-networks/02-activation-functions.mdx",
  ["collapse.ts", "activations.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  `
assert.ok(captured[0] < 1e-5);
assert.deepEqual(captured[1], [0, 0, 0, 1.5, 3]);
assert.ok(captured[2].every((value, i) => Math.abs(value - [0.1192, 0.3775, 0.5, 0.8176, 0.9526][i]) < 0.001));
assert.ok(captured[3].every((value, i) => Math.abs(value - [-0.964, -0.4621, 0, 0.9051, 0.9951][i]) < 0.001));
`,
);
await run(
  "neural-networks/02-activation-functions.mdx",
  ["relu-keeps-shape.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  "assert.deepEqual(captured, [[2, 2], [[0, 2], [0.5, 0]]]);",
);
await run("neural-networks/03-layers-and-architecture.mdx", [
  "layer-architecture.ts",
]);
await run(
  "neural-networks/03-layers-and-architecture.mdx",
  ["parameter-quote.js"],
  "",
  "assert.deepEqual(layerCounts, [112,136,9]); assert.equal(quotedParams,257);",
);
await run(
  "neural-networks/03-layers-and-architecture.mdx",
  ["xor-capacity.js"],
  "",
  "assert.deepEqual(outputs,[0,1,1,0]);",
);
await run(
  "neural-networks/04-forward-pass.mdx",
  [
    "diagnostic-forward.js",
    "inspect-diagnostic-unit.js",
    "diagnostic-batches.js",
  ],
  "const observed = []; console.log = (...values) => observed.push(values);\n",
  `
assert.deepEqual(selectedRow,[3,4]);
assert.equal(products.length,2);
assert.ok(Math.abs(manual-captured)<1e-5);
assert.deepEqual(observed[0],[[2,3]]);
assert.deepEqual(observed[3],[[1,2],[1,3]]);
assert.deepEqual(observed[4],[[3,3]]);
`,
);
await run("neural-networks/04-forward-pass.mdx", [
  "forward-pass.ts",
  "by-hand.ts",
]);
await run("neural-networks/05-building-a-network.mdx", ["complete-network.ts"]);
await run(
  "neural-networks/05-building-a-network.mdx",
  ["compile-rehearsal.ts"],
  `
const network=tf.sequential({layers:[
 tf.layers.dense({inputShape:[8],units:24,activation:'relu'}),
 tf.layers.dense({units:12,activation:'relu'}),
 tf.layers.dense({units:1,activation:'sigmoid'}),
]});
const initial=network.getWeights().map(weight=>Array.from(weight.dataSync()));
`,
  `
assert.equal(network.countParams(),529);
assert.equal(network.optimizer.iterations,0);
assert.deepEqual(network.getWeights().map(weight=>Array.from(weight.dataSync())),initial);
network.dispose();
`,
);
const networkYaml = await readFile(
  new URL("neural-networks/exercises/simple-network.yaml", base),
  "utf8",
);
const networkSolution = networkYaml
  .split("solutionCode: |\n")[1]
  .split("\ntestCode:")[0]
  .replace(/^ {2}/gm, "");
const rehearsalSetup = networkSolution.split(
  "const model = buildClassifier();",
)[0];
assert.ok(rehearsalSetup.includes("function buildClassifier()"));
await run(
  "neural-networks/05-building-a-network.mdx",
  ["initial-rehearsal.ts", "train-first-rehearsal.ts"],
  rehearsalSetup,
  `
assert.notEqual(model,second);
assert.equal(model.countParams(),529);
assert.equal(second.countParams(),529);
assert.equal(initialWeights.length,6);
assert.equal(initialWeights.flat().length,529);
assert.equal(sweepOne.length,120);
assert.equal(sweepTwo.length,120);
assert.equal(trainedSweep.length,120);
assert.deepEqual(secondAgain,sweepTwo);
assert.equal(model.optimizer.iterations,400);
assert.equal(second.optimizer.iterations,0);
assert.equal(history.history.loss.length,50);
assert.ok(history.history.loss.every(Number.isFinite));
model.dispose(); second.dispose(); readings.dispose(); labels.dispose();
`,
);
await run(
  "training-loop/01-loss-functions.mdx",
  ["mse-probe.ts"],
  "const captured = []; console.log = (...values) => captured.push(values);\n",
  `
assert.equal(captured.length,3);
for (const [actual,expected] of captured[0][0].map((value,index)=>[value,[-0.5,0.5,0.1,0.3][index]])) {
 assert.ok(Math.abs(actual-expected)<1e-6);
}
for (const [actual,expected] of captured[1][0].map((value,index)=>[value,[0.25,0.25,0.01,0.09][index]])) {
 assert.ok(Math.abs(actual-expected)<1e-6);
}
assert.deepEqual(captured[2][0],[]);
assert.ok(Math.abs(captured[2][1]-0.15)<1e-6);
`,
);
await run(
  "training-loop/01-loss-functions.mdx",
  ["bce-probes.ts"],
  "const captured = []; console.log = (...values) => captured.push(values);\n",
  `
assert.deepEqual(captured.map(row=>row[0]),[[3,-3],[-3,3],[0,0]]);
const expectedLosses=[Math.log1p(Math.exp(-3)),Math.log1p(Math.exp(3)),Math.log(2)];
for (let index=0;index<3;index++) {
 assert.ok(Math.abs(captured[index][2]-expectedLosses[index])<1e-6);
 for (let column=0;column<2;column++) {
  const expected=1/(1+Math.exp(-captured[index][0][column]));
  assert.ok(Math.abs(captured[index][1][column]-expected)<1e-6);
 }
}
assert.ok(captured[0][2]<captured[2][2]&&captured[2][2]<captured[1][2]);
`,
);
await run(
  "training-loop/01-loss-functions.mdx",
  ["bce-form-contract.js"],
  "const captured = []; console.log = (...values) => captured.push(values);\n",
  `
assert.deepEqual(captured,[
 ['Declared:','probabilities'],['Declared:','logits'],
 ['Rejected:','sigmoid'],['Rejected:','softmax'],['Rejected:','relu'],
 ['Rejected:','unknown'],['Rejected:',undefined],['Rejected:',null],
]);
`,
);
await run(
  "training-loop/01-loss-functions.mdx",
  ["loss-functions.ts"],
  "const captured = []; console.log = (label, value) => captured.push(Array.from(value));\n",
  `
assert.ok(Math.abs(captured[0][0] - 0.268) < 1e-6);
assert.ok(Math.abs(captured[1][0] - 0.7177) < 0.001);
assert.equal(captured[2][0], 0);
`,
);
await run(
  "training-loop/02-gradient-descent.mdx",
  ["scalar-step.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  `
assert.deepEqual(captured,[{
 oldWeight:5,oldLoss:25,slope:10,learningRate:0.1,amount:1,newWeight:4,newLoss:16,
}]);
`,
);
await run(
  "training-loop/02-gradient-descent.mdx",
  ["different-loss-gradients.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  `
assert.equal(captured.length,2);
assert.ok(Math.abs(captured[0]-15.36)<1e-5);
assert.ok(Math.abs(captured[1]-Math.cos(0.5))<1e-6);
`,
);
await run(
  "training-loop/02-gradient-descent.mdx",
  ["gradient-descent.ts"],
  "const captured = []; console.log = value => captured.push(value);\n",
  `
assert.deepEqual(captured, [
  'Step 0: x=0.600, loss=9.000',
  'Step 5: x=2.214, loss=0.966',
  'Step 10: x=2.742, loss=0.104',
  'Step 15: x=2.916, loss=0.011',
]);
`,
);
await run(
  "training-loop/03-backpropagation.mdx",
  ["scalar-slope.ts"],
  "",
  "assert.ok(Math.abs(estimate - 4.001) < 0.002);",
);
await run(
  "training-loop/03-backpropagation.mdx",
  ["temporary-weight.ts"],
  "const observed = []; console.log = value => observed.push(value);\n",
  "assert.ok(Math.abs(observed[0] - 2.001) < 1e-6); assert.equal(observed[1], 2);",
);
await run(
  "training-loop/03-backpropagation.mdx",
  ["automatic-slope.ts"],
  "const observed = []; console.log = value => observed.push(value);\n",
  "assert.deepEqual(observed, [4, 4, 2]);",
);
await run("training-loop/03-backpropagation.mdx", ["backpropagation.ts"]);
await run(
  "training-loop/04-training-loop.mdx",
  ["updates-per-epoch.js", "compare-two-windows.ts"],
  "",
  `
assert.deepEqual(batchRows,[32,32,16]);
assert.equal(batchRows.reduce((total,rows)=>total+rows,0),trainingRows);
assert.equal(updatesPerEpoch,3);
assert.equal(exampleTraining.length,50);
assert.equal(exampleValidation.length,50);
assert.equal(windowMeans(exampleTraining).previous,1);
assert.ok(Math.abs(windowMeans(exampleTraining).recent-0.8)<1e-12);
assert.equal(windowMeans(exampleValidation).previous,1);
assert.ok(Math.abs(windowMeans(exampleValidation).recent-1.2)<1e-12);
`,
);
const trainingYaml = await readFile(
  new URL("training-loop/exercises/training-loop-exercise.yaml", base),
  "utf8",
);
const trainingSolution = trainingYaml
  .split("solutionCode: |\n")[1]
  .split("\ntestCode:")[0]
  .replace(/^ {2}/gm, "");
const trainingSetup = trainingSolution.split("function makeEarlyStopping()")[0];
assert.ok(trainingSetup.includes("const model = tf.sequential();"));
await run(
  "training-loop/04-training-loop.mdx",
  ["watch-validation.ts"],
  trainingSetup +
    `
const fitCalls=[];
const actualFit=model.fit.bind(model);
model.fit=(xs,ys,args)=>{fitCalls.push({xs,ys,args});return actualFit(xs,ys,args);};
`,
  `
assert.equal(model.countParams(),673);
assert.equal(fitCalls.length,1);
assert.equal(fitCalls[0].xs,trainX);
assert.equal(fitCalls[0].ys,trainY);
assert.equal(fitCalls[0].args.epochs,500);
assert.equal(fitCalls[0].args.batchSize,32);
assert.equal(fitCalls[0].args.validationSplit,0.2);
assert.equal(fitCalls[0].args.callbacks.monitor,'val_loss');
assert.equal(fitCalls[0].args.callbacks.patience,5);
assert.equal(trainingLoss,history.history.loss);
assert.equal(validationLoss,history.history.val_loss);
assert.ok(history.epoch.length>=1&&history.epoch.length<=500);
assert.equal(trainingLoss.length,history.epoch.length);
assert.equal(validationLoss.length,history.epoch.length);
assert.ok(trainingLoss.every(value=>Number.isFinite(value)&&value>=0));
assert.ok(validationLoss.every(value=>Number.isFinite(value)&&value>=0));
assert.equal(model.optimizer.iterations,history.epoch.length*3);
const validationLabels=Array.from(trainY.dataSync()).slice(80);
assert.equal(validationLabels.filter(label=>label===0).length,10);
assert.equal(validationLabels.filter(label=>label===1).length,10);
model.dispose();tf.dispose([trainX,trainY]);
`,
);
const evaluationYaml = await readFile(
  new URL("training-loop/exercises/deep-scan-eval.yaml", base),
  "utf8",
);
const evaluationSolution = evaluationYaml
  .split("solutionCode: |\n")[1]
  .split("\ntestCode:")[0]
  .replace(/^ {2}/gm, "");
const evaluationSetup = evaluationSolution.split(
  "const history = await model.fit(",
)[0];
assert.ok(evaluationSetup.includes("const model = tf.sequential();"));
await run(
  "training-loop/05-evaluating-deep-scan.mdx",
  ["measure-the-gap.ts", "constant-baseline.ts"],
  evaluationSetup,
  `
assert.deepEqual(trainX.shape,[100,3]);
assert.deepEqual(testX.shape,[43,3]);
assert.equal(model.countParams(),673);
assert.equal(model.optimizer.iterations,210);
assert.equal(history.epoch.length,30);
assert.equal(evalResult.length,2);
assert.ok(evalResult.every(metric=>metric.rank===0));
assert.ok(Number.isFinite(trainAcc)&&trainAcc>=0&&trainAcc<=1);
assert.ok(Number.isFinite(testAcc)&&testAcc>=0&&testAcc<=1);
assert.equal(gap,trainAcc-testAcc);
assert.equal(baselineClass,0);
assert.equal(baselineCorrect,20);
assert.equal(baselineAccuracy,20/43);
assert.equal(heldOutLabels.filter(label=>label!==baselineClass).length,23);
const scores=tf.tidy(()=>Array.from(model.predict(testX).dataSync()));
const correct=scores.filter((score,index)=>Number(score>0.5)===heldOutLabels[index]).length;
assert.ok(Math.abs(testAcc-correct/43)<1e-6);
model.dispose();tf.dispose([trainX,trainY,testX,testY,...evalResult]);
`,
);
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

// These registrations execute real CPU tensor code with declared local IO,
// session, clock, and pipeline substitutes. They make no device-speed,
// browser-storage, network-download, or pretrained-quality claim.
const runtimeManifest = JSON.parse(
  await readFile(
    new URL("../apps/web/public/models/deep-scan/model.json", import.meta.url),
    "utf8",
  ),
);
const runtimeWeights = Uint8Array.from(
  await readFile(
    new URL("../apps/web/public/models/deep-scan/weights.bin", import.meta.url),
  ),
);
assert.equal(runtimeWeights.byteLength, 2692);
const runtimeReview = {
  manifest: runtimeManifest,
  weightData: runtimeWeights.slice().buffer,
  OnnxTensor,
  loadModel: () =>
    tf.loadLayersModel(
      tf.io.fromMemory({
        modelTopology: structuredClone(runtimeManifest.modelTopology),
        weightSpecs: structuredClone(
          runtimeManifest.weightsManifest.flatMap((group) => group.weights),
        ),
        weightData: runtimeWeights.slice().buffer,
      }),
    ),
};
await run(
  "browser-runtimes/01-why-the-browser.mdx",
  ["deployment-policy-probes.js"],
  "const captured=[];console.log=value=>captured.push(value);\n",
  `
assert.deepEqual(captured,[
 {localRequired:false,exceedsDownloadBudget:false,belowLatencyPreference:true},
 {localRequired:false,exceedsDownloadBudget:false,belowLatencyPreference:false},
 {localRequired:true,exceedsDownloadBudget:true,belowLatencyPreference:false},
]);`,
);
await run(
  "browser-runtimes/01-why-the-browser.mdx",
  ["model-download-budget.js"],
  "const captured=[];console.log=value=>captured.push(value);\n",
  `
assert.deepEqual(captured,[40,38.14697265625]);`,
);
await run(
  "browser-runtimes/01-why-the-browser.mdx",
  ["inference-comparison.ts"],
  `
const model=await review.loadModel();let failRequest=false;const requests=[];
const fetch=async(url,options)=>{requests.push({url,options});return {ok:!failRequest,json:async()=>({class:'anomaly',score:0.6})};};
`,
  `
const values=[0.3,0.4,0.5];
assert.deepEqual(await serverInference(values),{class:'anomaly',score:0.6});
assert.equal(requests[0].url,'/api/classify');assert.equal(requests[0].options.method,'POST');
assert.deepEqual(JSON.parse(requests[0].options.body),{signal:values});
failRequest=true;await assert.rejects(serverInference(values),/Classification request failed/);
const score=tf.tidy(()=>model.predict(tf.tensor2d([values])).dataSync()[0]);
assert.deepEqual(await clientInference(values),{class:score>0.5?'anomaly':'noise',score});
model.dispose();`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/01-why-the-browser.mdx",
  ["browser-constraints.ts"],
  `
const parameterCount=10_000_000;const input=tf.ones([1,3]);let clock=0;
const performance={now:()=>clock++};const loads=[];
tf={...tf,loadLayersModel:async url=>{loads.push(url);return review.loadModel();}};
`,
  `
assert.equal(modelSizeMB,40);assert.deepEqual(loads,['/models/deep-scan/model.json']);
assert.equal(coldStartMs,1);assert.equal(inferenceMs,1);assert.equal(output.isDisposed,true);
assert.equal(model.countParams(),673);input.dispose();model.dispose();`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/02-tensorflow-js-setup.mdx",
  ["setup.ts"],
  "",
  `
assert.equal(preferenceStatus,'accepted');assert.equal(activeBackend,'cpu');assert.equal(activeVersion,tf.version.tfjs);`,
);
await run(
  "browser-runtimes/02-tensorflow-js-setup.mdx",
  ["backends.ts"],
  `
const actualTf=tf;const navigator={gpu:{}};const attempts=[];const paths=[];
const setWasmPaths=value=>paths.push(value);
tf={...tf,setBackend:async name=>{attempts.push(name);if(name==='webgl')throw Error('controlled unavailable registration');return name==='cpu'?actualTf.setBackend('cpu'):false;}};
`,
  `
assert.deepEqual(attempts,['webgpu','webgl','wasm','cpu']);assert.deepEqual(paths,['/wasm/']);assert.equal(tf.getBackend(),'cpu');`,
);
await run(
  "browser-runtimes/02-tensorflow-js-setup.mdx",
  ["benchmark.ts"],
  `
let clock=0,calls=0;const performance={now:()=>clock++};const actualMatMul=tf.matMul;
tf={...tf,matMul:(...args)=>{calls++;return actualMatMul(...args);}};
`,
  `
const result=await benchmarkBackend('cpu');assert.equal(result.backend,'cpu');
assert.equal(calls,120);assert.equal(result.times.length,100);assert.ok(result.times.every(value=>value===1));`,
);
await run(
  "browser-runtimes/03-model-loading.mdx",
  ["model-loading.ts"],
  `
const loads=[];const captured=[];console.log=value=>captured.push(value);
tf={...tf,loadLayersModel:async url=>{loads.push(url);return review.loadModel();}};
`,
  `
assert.deepEqual(loads,['/models/deep-scan/model.json']);
assert.deepEqual(captured[0],{inputShape:[null,3],outputShape:[null,1],layerCount:3});
const inspectionProbe=tf.zeros([1,3]);
try {assert.throws(()=>inspected.predict(inspectionProbe),/disposed/);}
finally {inspectionProbe.dispose();}
`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/03-model-loading.mdx",
  ["under-the-hood.ts"],
  `
const requests=[];const fetch=async url=>{requests.push(url);return {json:async()=>structuredClone(review.manifest),arrayBuffer:async()=>review.weightData.slice(0)};};
`,
  `
assert.deepEqual(requests,['/models/deep-scan/model.json','/models/deep-scan/weights.bin']);
assert.equal(weightData.byteLength,2692);assert.deepEqual(manifest.weightsManifest.flatMap(group=>group.paths),['weights.bin']);`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/03-model-loading.mdx",
  ["export.ts"],
  `
const model=await review.loadModel();const destinations=[];const artifacts=[];const actualSave=model.save.bind(model);
model.save=async destination=>{destinations.push(destination);return actualSave(tf.io.withSaveHandler(async artifact=>{artifacts.push(artifact);return {modelArtifactsInfo:{dateSaved:new Date(0),modelTopologyType:'JSON'}};}));};
`,
  `
assert.deepEqual(destinations,['file://./models/deep-scan','downloads://deep-scan']);
assert.equal(artifacts.length,2);assert.ok(artifacts.every(artifact=>artifact.weightData.byteLength===2692));
assert.equal(model.countParams(),673);model.dispose();`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/03-model-loading.mdx",
  ["model-caching.ts"],
  `
let stored=false,failSave=true;const loads=[],saves=[];
const load=async url=>{loads.push(url);if(url.startsWith('indexeddb://')&&!stored)throw Error('controlled cache miss');
 const loaded=await review.loadModel();const actualSave=loaded.save.bind(loaded);
 loaded.save=async key=>{saves.push(key);if(failSave)throw Error('controlled quota failure');
  const result=await actualSave(tf.io.withSaveHandler(async artifact=>{assert.equal(artifact.weightData.byteLength,2692);stored=true;return {modelArtifactsInfo:{dateSaved:new Date(0),modelTopologyType:'JSON'}};}));return result;};return loaded;};
tf={...tf,loadLayersModel:load,io:{...tf.io,listModels:async()=>stored?{'indexeddb://deep-scan-v1':{dateSaved:new Date(0)}}:{}}};
`,
  `
assert.equal(model.countParams(),673);assert.deepEqual(savedModels,{});
assert.deepEqual(loads,['indexeddb://deep-scan-v1','/models/deep-scan/model.json']);
failSave=false;const fetched=await loadModelWithCache();const cached=await loadModelWithCache();
assert.equal(loads.filter(url=>url==='/models/deep-scan/model.json').length,2);
assert.equal(saves.length,2);assert.equal(cached.countParams(),673);
model.dispose();fetched.dispose();cached.dispose();`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/03-model-loading.mdx",
  ["loading-ui.ts"],
  `
const failure=Error('controlled missing model');
tf={...tf,loadLayersModel:async(url,options)=>{if(url==='/missing.json')throw failure;
 options.onProgress(0.25);options.onProgress(1);return review.loadModel();}};
`,
  `
const events=[];const loaded=await loadWithProgress('/models/deep-scan/model.json',event=>events.push(event));
assert.deepEqual(events.slice(0,3),[{status:'loading',progress:0},{status:'loading',progress:0.25},{status:'loading',progress:1}]);
assert.equal(events[3].status,'ready');assert.equal(events[3].model,loaded);assert.equal(loaded.countParams(),673);loaded.dispose();
const failures=[];await assert.rejects(loadWithProgress('/missing.json',event=>failures.push(event)),error=>error===failure);
assert.deepEqual(failures,[{status:'loading',progress:0},{status:'error',message:'controlled missing model'}]);`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/04-inference-pipeline.mdx",
  ["memory-management.ts"],
  `
const model=await review.loadModel();const owned=[];const tensor2d=tf.tensor2d;const predict=model.predict.bind(model);
tf={...tf,tensor2d:(...args)=>{const tensor=tensor2d(...args);owned.push(tensor);return tensor;}};
model.predict=input=>{const output=predict(input);owned.push(output);return output;};
`,
  `
const baseline=tf.memory().numTensors;const first=leakyPredict(model,[0.5,0.3,0.7]);
assert.equal(tf.memory().numTensors,baseline+2);assert.equal(cleanPredict(model,[0.5,0.3,0.7]),first);
assert.equal(tf.memory().numTensors,baseline+2);owned.forEach(tensor=>{if(!tensor.isDisposed)tensor.dispose();});model.dispose();`,
  undefined,
  runtimeReview,
);
const inferenceDefinitions = codeBlocks(
  await readFile(
    new URL("browser-runtimes/04-inference-pipeline.mdx", base),
    "utf8",
  ),
)
  .find((block) => block.title === "inference-pipeline.ts")
  .code.replace(/^import .*?;\s*$/gm, "");
await run(
  "browser-runtimes/04-inference-pipeline.mdx",
  ["dashboard-integration.ts"],
  `
${inferenceDefinitions}
const model=await review.loadModel();const signalFeed=new EventTarget();const updates=[];
const updateDashboard=value=>updates.push(value);let clock=0;const performance={now:()=>clock++};
`,
  `
const reading={timestamp:1,amplitude:1536,frequency:0,phase:0};
signalFeed.dispatchEvent(new CustomEvent('reading',{detail:reading}));
assert.equal(updates.length,1);assert.deepEqual(updates[0],{...classify(model,reading),latencyMs:1});
signalFeed.removeEventListener('reading',onReading);signalFeed.dispatchEvent(new CustomEvent('reading',{detail:reading}));
assert.equal(updates.length,1);model.dispose();`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/04-inference-pipeline.mdx",
  ["tensor-headroom.js"],
  "",
  `
assert.equal(elapsedHours,1);assert.equal(increase,120);assert.equal(hourlyGrowth,120);assert.equal(remaining,9480);assert.equal(remaining/hourlyGrowth,79);`,
);
await run(
  "browser-runtimes/05-onnx-runtime-web.mdx",
  ["completed-tfjs-call.ts"],
  `
const model=await review.loadModel();let clock=0;const performance={now:()=>clock++};
`,
  `
assert.ok(Number.isFinite(tfjsScore)&&tfjsScore>=0&&tfjsScore<=1);assert.equal(tfjsMs,1);
assert.equal(output.isDisposed,true);assert.equal(batch.isDisposed,true);assert.equal(model.countParams(),673);model.dispose();`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/05-onnx-runtime-web.mdx",
  ["onnx-basics.ts"],
  `
let inputSeen,outputSeen,releases=0,creates=0;
const ort={env:{wasm:{}},Tensor:review.OnnxTensor,InferenceSession:{create:async(path,options)=>{
 creates++;assert.equal(path,'/models/deep-scan.onnx');assert.deepEqual(options,{executionProviders:['wasm']});
 return {inputNames:['input'],outputNames:['output'],run:async feeds=>{
  inputSeen=feeds.input;assert.equal(inputSeen.type,'float32');assert.deepEqual(inputSeen.dims,[1,3]);
  assert.deepEqual(Array.from(inputSeen.data),Array.from(new Float32Array([0.5,0.3,0.7])));
  outputSeen=new review.OnnxTensor('float32',new Float32Array([0.5]),[1,1]);return {output:outputSeen};
 },release:async()=>{releases++;}};
}}};
`,
  `
assert.equal(creates,1);assert.equal(releases,1);assert.equal(ort.env.wasm.numThreads,1);assert.equal(ort.env.wasm.wasmPaths,'/ort-wasm/');
assert.throws(()=>inputSeen.data,/disposed/);assert.throws(()=>outputSeen.data,/disposed/);`,
  undefined,
  runtimeReview,
);
await run(
  "browser-runtimes/05-onnx-runtime-web.mdx",
  ["measure-inference.ts"],
  `
let clock=0,calls=0;const performance={now:()=>clock};
const controlledRun=async()=>{calls++;await Promise.resolve();clock+=calls<=20?2:calls-20;};
`,
  `
const result=await measure(controlledRun);assert.equal(calls,220);assert.equal(result.samples.length,200);
assert.deepEqual(result.samples,Array.from({length:200},(_,i)=>i+1));assert.equal(result.medianMs,100.5);assert.equal(result.p95Ms,190);`,
);
await run(
  "browser-runtimes/06-transformers-js.mdx",
  ["batch-report-call.ts"],
  `
const reports=['coupling nominal','coolant loop warning','watch handover clean'];let loads=0,calls=0;
const supplied=[{label:'POS',score:0.5},{label:'NEG',score:0.99},{label:'POS',score:0.7}];
const pipelineFactory=async task=>{loads++;assert.equal(task,'sentiment-analysis');return async values=>{calls++;assert.equal(values,reports);return supplied;};};
`,
  `
assert.equal(loads,1);assert.equal(calls,1);assert.equal(predictions,supplied);`,
);
await run(
  "browser-runtimes/06-transformers-js.mdx",
  ["report-pairing.js"],
  "",
  `
assert.deepEqual(queue,[{text:'coolant loop warning',label:'NEG',score:0.99},{text:'watch handover clean',label:'POS',score:0.7},{text:'coupling nominal',label:'POS',score:0.5}]);`,
);
await run(
  "browser-runtimes/06-transformers-js.mdx",
  ["sentiment-pipeline.ts"],
  `
let loads=0,calls=0,disposals=0;const captured=[];console.table=rows=>captured.push(rows);
const supplied=[{label:'POSITIVE',score:0.91},{label:'POSITIVE',score:0.85},{label:'NEGATIVE',score:0.99},{label:'NEGATIVE',score:0.6}];
const pipeline=async(task,id,options)=>{loads++;assert.equal(task,'sentiment-analysis');
 assert.equal(id,'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
 assert.deepEqual(options,{revision:'0b6928efcb76139cae2c6881d49cda67fe119f42',dtype:'q8',device:'wasm'});
 const classify=async reports=>{calls++;assert.equal(reports.length,4);return supplied;};classify.dispose=async()=>{disposals++;};return classify;};
`,
  `
assert.equal(loads,1);assert.equal(calls,1);assert.equal(disposals,1);
assert.deepEqual(captured[0].map(row=>row.text),[
 'Catastrophic failure on the port-side coupling.','Starboard array cleared diagnostics ahead of schedule.',
 'Sensor array is functioning within tolerance.','Signal classification: anomalous.',
]);assert.deepEqual(captured[0].map(row=>row.score),[0.99,0.91,0.85,0.6]);`,
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
  .filter(({ title }) => title !== "capture-pair.ts")
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
await run(
  "recurrent-networks/03-lstm-gates.mdx",
  ["lstm-gates.ts"],
  "",
  `
assert.equal(newCell, 1);
assert.ok(Math.abs(newHidden - 0.3807970779778824) < 1e-12);
`,
);
await run(
  "recurrent-networks/03-lstm-gates.mdx",
  ["lstm-weighted-gate.ts"],
  "",
  `
assert.ok(Math.abs(forgetSum + 1.44) < 1e-12);
assert.ok(Math.abs(forgetGate - 0.19154534856146752) < 1e-12);
`,
);
await run(
  "recurrent-networks/03-lstm-gates.mdx",
  ["lstm-cell-weights.ts"],
  "",
  `
assert.deepEqual([kernel.shape, recurrentKernel.shape, bias.shape], [[1, 4], [1, 4], [4]]);
assert.equal(forgetRow.length, 3);
assert.equal(forgetRow[2], 0);
`,
);
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

await run(
  "capstone/01-system-architecture.mdx",
  ["composition-handoffs.ts"],
  "",
  `
assert.equal(normalized.length, 8); assert.equal(magnitudes.length, 5);
assert.deepEqual(input.shape, [1, 5]); assert.ok(input.isDisposedInternal);
assert.ok(Math.abs(normalized[1] - Math.SQRT2) < 1e-5);
assert.ok(Math.abs(magnitudes[2] - 4) < 1e-5);
`,
);
await run(
  "capstone/02-ci-cd-pipeline.mdx",
  ["release-score-trace.ts"],
  "",
  `
assert.equal(correct, 4); assert.equal(total, 5); assert.equal(score, 0.8);
`,
);
await run(
  "capstone/03-monitoring.mdx",
  ["monitor-log-trace.ts"],
  "",
  `
assert.deepEqual([0,50,95,99,100].map(percentile), [40,89,134,400,400]);
assert.deepEqual(recentMean, [1,2]); assert.equal(durations.length, 100);
`,
);
await run(
  "capstone/04-documentation.mdx",
  ["card-field-trace.ts"],
  "",
  `
assert.deepEqual(lowest, ['anomaly',0.84]); assert.equal(percentage(accuracy),'91.8%');
`,
);
await run(
  "capstone/05-launch.mdx",
  ["launch-check-trace.ts"],
  "",
  `
assert.deepEqual(ordered.map(row=>row.name), ['load','probe']);
assert.ok(ordered.every(row=>row.passed));
`,
);

await run(
  "signal-processing/01-time-vs-frequency.mdx",
  ["capture-pair.ts"],
  "",
  `assert.equal(sampleCount,512);assert.ok(Math.abs(gap-11.96)<.1);assert.equal(selectedBin*sampleRate/sampleCount,73.5);`,
);

await run(
  "signal-processing/03-spectrograms.mdx",
  ["one-frame-spectrum.ts"],
  "",
  `assert.equal(selectedSpectrum.length,33);assert.ok(Math.abs(selectedSpectrum[10]-32)<1e-4);`,
);

await run(
  "signal-processing/04-fft-as-features.mdx",
  ["feature-row-probe.ts"],
  "",
  `assert.equal(strictCrossings,25);assert.ok(Math.abs(rawMagnitudes[13]-32)<1e-4);assert.ok(Math.abs(rawMagnitudes[18]-16)<1e-4);`,
);

await run(
  "signal-processing/05-windowing-and-overlap.mdx",
  ["symmetric-hann-probe.ts"],
  "",
  `assert.equal(symmetricWeights[0],0);assert.equal(symmetricWeights.at(-1),0);assert.ok(farMagnitudeSum(before)/farMagnitudeSum(after)>20);`,
);

await run(
  "llm-integration/01-llms-for-science.mdx",
  ["reply-boundary.js"],
  "",
  `assert.equal(fields.classification,'anomaly');assert.equal(fields.confidence,.95);`,
);

await run(
  "llm-integration/02-prompt-engineering.mdx",
  ["prompt-argument-lines.js"],
  "",
  `assert.ok(reading.includes('frequency: 73.4 Hz'));assert.ok(reading.includes('phase: 0.23 rad'));`,
);

await run(
  "llm-integration/04-report-generation.mdx",
  ["section-review-handoff.js"],
  "",
  `assert.equal(section.validated,false);assert.equal(section.content,draft.generated);`,
);

await run(
  "llm-integration/05-multi-model-systems.mdx",
  ["classifier-feature-handoff.js"],
  "",
  `assert.equal(scaled[0],180/2048);assert.equal(scaled[1],5/63);assert.equal(scaled[2],(.3+Math.PI)/(2*Math.PI));`,
);

await run(
  "optimization-edge/01-model-profiling.mdx",
  ["profile-duration-mean.js"],
  "",
  `assert.equal(measured.length,5);assert.equal(meanMs,24);`,
);

await run(
  "optimization-edge/02-quantization.mdx",
  ["selected-kernel-code.js"],
  "",
  `assert.equal(code,51);assert.ok(Math.abs(decoded)<1e-9);assert.ok(Math.abs(decoded-original)<=scale/2);`,
);

await run(
  "optimization-edge/04-caching-strategies.mdx",
  ["cache-key-fields.js"],
  "",
  `assert.deepEqual(rounded,[.5,.5]);assert.equal(key,JSON.stringify(['float32',[1,2],[.5,.5]]));`,
);

await run(
  "anomaly-detection/01-normal-vs-anomalous.mdx",
  ["baseline-distance.js"],
  "",
  `assert.equal(sigmaDistance,5);`,
);

await run(
  "anomaly-detection/01-normal-vs-anomalous.mdx",
  ["candidate-baseline.js"],
  "",
  `assert.equal(candidateMean,13);assert.ok(Math.abs(candidateSpread-Math.sqrt(2))<1e-10);`,
);

await run(
  "anomaly-detection/02-autoencoders.mdx",
  ["screened-row-selection.js"],
  "",
  `assert.deepEqual(keptIndices,[0,2]);`,
);

await run(
  "anomaly-detection/02-autoencoders.mdx",
  ["screened-autoencoder.ts"],
  "",
  `const model=makeScreenedAutoencoder();try{assert.equal(model.countParams(),98);}finally{model.dispose();}`,
);

await run(
  "anomaly-detection/03-reconstruction-error.mdx",
  ["offset-reconstruction.js"],
  "",
  `assert.ok(Math.abs(rowMse-.01)<1e-5);`,
);

await run(
  "anomaly-detection/04-threshold-tuning.mdx",
  ["validation-candidate.js"],
  "",
  `assert.ok(Math.abs(candidateF1-6/7)<1e-10);`,
);

await run(
  "anomaly-detection/05-the-anomaly.mdx",
  ["window-vote-trace.ts"],
  "",
  `assert.ok(Math.abs(signedDistance+4/3)<1e-5);`,
);

await run(
  "advanced-time-series/01-beyond-lstm.mdx",
  ["query-value-trace.js"],
  "",
  `assert.ok(Math.abs(valueBlend[0]-1.462117)<1e-5);assert.ok(Math.abs(valueBlend[1]-.537883)<1e-5);`,
);

await run(
  "advanced-time-series/02-temporal-attention.mdx",
  ["position-score-trace.ts"],
  "",
  `assert.ok(Math.abs(positionalExample.summary[0]-.330040)<1e-5);assert.ok(Math.abs(positionalExample.summary[1]-1.359687)<1e-5);`,
);

await run(
  "advanced-time-series/03-forecasting.mdx",
  ["feedback-window-trace.js"],
  "",
  `assert.deepEqual(nextRolloutWindow,[2,3]);assert.deepEqual(nextReplayWindow,[2,10]);`,
);

await run(
  "advanced-time-series/04-kalman-filters.mdx",
  ["selected-day-update.js"],
  "",
  `assert.equal(kalmanGain,1.1/2.1);assert.ok(Math.abs(nextInterval-72.995238)<1e-5);assert.ok(Math.abs(nextVariance-.523810)<1e-5);`,
);

await run(
  "advanced-time-series/05-ensemble-methods.mdx",
  ["weights-from-prior.js"],
  "",
  `assert.equal(equalPrediction,10);assert.ok(Math.abs(priorWeightedPrediction-9.7321)<1e-4);`,
);

await run(
  "recurrent-networks/01-sequences-matter.mdx",
  ["window-target-probe.ts"],
  "",
  `assert.deepEqual(windowTensor.shape,[2,3,1]);assert.deepEqual(targetTensor.shape,[2,1]);assert.deepEqual(nextRows,[[4],[5]]);`,
);
await run(
  "recurrent-networks/02-simple-rnns.mdx",
  ["one-unit-rnn.ts"],
  "const captured=[]; console.log=(...args)=>captured.push(args);\n",
  `const library=captured[1][1];assert.equal(library.length,3);library.forEach((value,i)=>assert.ok(Math.abs(value-manualStates[i])<1e-5));`,
);
await run(
  "recurrent-networks/02-simple-rnns.mdx",
  ["recurrent-derivative-probe.js"],
  "const captured=[]; console.log=(...args)=>captured.push(args);\n",
  `assert.equal(captured.length,2);assert.ok(captured[0][0].atStep14>captured[0][0].after60);assert.ok(captured[1][0].atStep14>captured[1][0].after60);assert.ok(captured[1][0].atStep14>1);`,
);
await run(
  "recurrent-networks/04-sliding-windows.mdx",
  ["classification-window-probe.js"],
  "const captured=[]; console.log=(...args)=>captured.push(args);\n",
  `assert.deepEqual(captured.map(row=>row[0].membership),['training','dropped','evaluation']);assert.deepEqual(captured.map(row=>row[0].externalLabel),[1,1,0]);`,
);
await run(
  "recurrent-networks/05-sequence-prediction.mdx",
  ["small-forecaster.ts"],
  "const captured=[]; console.log=(...args)=>captured.push(args);\n",
  `const fit=captured[0][0];assert.deepEqual(fit.inputShape,[64,5,3]);assert.equal(fit.epochs,12);assert.equal(fit.updates,24);assert.ok(fit.loss.every(Number.isFinite));assert.ok(fit.mae.every(Number.isFinite));`,
);
await run(
  "recurrent-networks/05-sequence-prediction.mdx",
  ["forecast-feedback-probe.js"],
  "const captured=[]; console.log=(...args)=>captured.push(args);\n",
  `assert.equal(captured.length,2);assert.ok(Math.abs(captured[1][0].raw[0]-3.1)<1e-10);assert.equal(captured[1][0].clamped[0],2);assert.equal(workingHistory.at(-1)[0],2);`,
);

// Controlled startup outcomes and clock costs verify orchestration only.
// These checks establish no hardware support or measured device performance.
await run(
  "optimization-edge/05-webgpu-acceleration.mdx",
  ["webgpu-setup.ts"],
  `const navigator = {gpu:{}}; const calls=[]; let active='cpu';
const tf = {
  setBackend:async name=>{calls.push(name);if(name==='webgpu')throw Error('unregistered');if(name==='webgl')return false;active=name;return true;},
  ready:async()=>{calls.push('ready');}, getBackend:()=>{calls.push('getBackend');return active;}
};`,
  `assert.equal(backend,'wasm');assert.deepEqual(calls,['webgpu','webgl','wasm','ready','getBackend']);`,
);
await run(
  "optimization-edge/05-webgpu-acceleration.mdx",
  ["measure-inference.ts"],
  `let clock=0; const performance={now:()=>clock}; const warmInput=tf.tensor2d([[1,2,3]]);
const model={predict:()=>{clock+=1;const out=warmInput.sum();const read=out.data.bind(out);out.data=async()=>{clock+=4;return read();};return out;}};`,
  `assert.equal(naive,1);assert.equal(honest,5);assert.equal(warmInput.isDisposedInternal,false);warmInput.dispose();`,
);

assert.ok(
  reviewedRuns > 0,
  "No reviewed code blocks matched the requested filters",
);
