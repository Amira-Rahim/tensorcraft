// Execute the repository's authored solution once for a local design preview.
// This is maintainer reference data, not learner work or a production grade.
const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../../..');
const repositoryRequire = createRequire(path.join(root, 'package.json'));
const contentRequire = createRequire(path.join(root, 'packages/content/package.json'));
const { parse } = createRequire(contentRequire.resolve('velite'))('yaml');
const tf = repositoryRequire('@tensorflow/tfjs');
const sourcePath = path.join(
  root,
  'packages/content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml',
);
const source = readFileSync(sourcePath, 'utf8');
const exercise = parse(source);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function main() {
  assert.equal(tf.version.tfjs, '4.22.0');
  await tf.setBackend('cpu');
  await tf.ready();
  const execute = new AsyncFunction('tf', `${exercise.solutionCode}
    try {
      const predictedScores = Array.from(model.predict(testX).dataSync());
      const labels = Array.from(testY.dataSync());
      const features = testX.arraySync();
      const threshold = 0.5;
      const cases = features.map((values, id) => ({
        id,
        features: values,
        label: labels[id],
        score: predictedScores[id],
        predicted: predictedScores[id] > threshold ? 1 : 0,
        source: id < 40 ? 'generated' : 'story',
      }));
      const confusion = { tp: 0, tn: 0, fp: 0, fn: 0 };
      for (const item of cases) {
        const category = item.label === 1
          ? (item.predicted === 1 ? 'tp' : 'fn')
          : (item.predicted === 1 ? 'fp' : 'tn');
        confusion[category] += 1;
      }
      return {
        model: { parameters: model.countParams(), features: trainX.shape[1], layers: [32, 16, 1] },
        train: { rows: trainX.shape[0], loss: history.history.loss.at(-1), accuracy: trainAcc },
        test: { rows: testX.shape[0], loss: evalResult[0].dataSync()[0], accuracy: testAcc },
        verdict,
        threshold,
        operator: '>',
        confusion,
        cases,
      };
    } finally {
      model.dispose();
      model.optimizer.dispose();
    }
  `);

  let measured;
  tf.engine().startScope();
  try {
    measured = await execute(tf);
  } finally {
    tf.engine().endScope();
    tf.disposeVariables();
  }

  assert.equal(measured.cases.length, 43);
  assert.equal(measured.model.parameters, 673);
  assert.equal(measured.model.features, 3);
  assert.equal(measured.train.rows, 100);
  assert.equal(measured.test.rows, 43);
  assert.equal(Object.values(measured.confusion).reduce((sum, value) => sum + value, 0), 43);
  assert.ok(Math.abs(
    (measured.confusion.tp + measured.confusion.tn) / 43 - measured.test.accuracy,
  ) < 1e-6);
  assert.deepEqual(measured.cases.map((item) => item.id), Array.from({ length: 43 }, (_, id) => id));
  for (const item of measured.cases) {
    assert.equal(item.features.length, 3);
    assert.ok(item.features.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
    assert.ok(Number.isFinite(item.score) && item.score >= 0 && item.score <= 1);
    assert.ok(item.label === 0 || item.label === 1);
    assert.equal(item.predicted, item.score > 0.5 ? 1 : 0);
    assert.equal(item.source, item.id < 40 ? 'generated' : 'story');
  }
  const record = {
    origin: 'maintainer reference run',
    capturedAt: new Date().toISOString(),
    runtimeVersion: tf.version.tfjs,
    backend: tf.getBackend(),
    ...measured,
    sourceHashes: {
      solution: sha256(exercise.solutionCode),
      test: sha256(exercise.testCode),
      exerciseYaml: sha256(source),
    },
  };
  writeFileSync(path.join(__dirname, 'maintainer-run.json'), JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify({
    path: 'docs/design-previews/evaluation-inspector/maintainer-run.json',
    runtimeVersion: record.runtimeVersion,
    backend: record.backend,
    accuracy: record.test.accuracy,
    confusion: record.confusion,
    verdict: record.verdict,
    retainedTensors: tf.memory().numTensors,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
