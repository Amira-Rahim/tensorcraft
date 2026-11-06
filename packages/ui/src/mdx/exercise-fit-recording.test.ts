// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import {
  FIT_RECORDING_SOURCE,
  type FitRecorder,
} from "./exercise-fit-recording.mjs";
import { parseAndRunTests } from "./exercise-runner-node";

const setup = `
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  model.compile({ optimizer: 'sgd', loss: 'meanSquaredError', metrics: ['accuracy'] });
  const x = tf.tensor2d([[1], [2]]), y = tf.tensor2d([[0], [1]]);
`;

describe("immutable fit summaries", () => {
  it("keeps measured values and call-time settings after returned history changes", async () => {
    const result = await parseAndRunTests(
      setup +
        `
      const options = { epochs: 2, batchSize: 1, shuffle: false };
      const history = await model.fit(x, y, options);
      const actualLoss = history.history.loss.slice();
      const actualAccuracy = history.history.acc.slice();
      options.epochs = 999;
      history.history.loss[0] = 999;
      history.history.acc[history.history.acc.length - 1] = 0.123456;
      history.epoch[0] = 999;
      x.dispose(); y.dispose();
    `,
      `
      it('captures before mutation', () => {
        const fit = tf.__fits[0];
        expect(fit.model === model || fit.model === model.model).toBe(true);
        expect(fit.history === history).toBe(true);
        expect(fit.settings.epochs).toBe(2);
        expect(fit.settings.batchSize).toBe(1);
        expect(fit.settings.shuffle).toBe(false);
        expect(fit.settings.parameters).toBe(2);
        expect(fit.settings.units).toEqual([1]);
        expect(fit.completed.points.map((point) => point.loss)).toEqual(actualLoss);
        expect(fit.completed.points.map((point) => point.epoch)).toEqual([1, 2]);
        expect(fit.completed.finalLoss).toBe(actualLoss[1]);
        expect(fit.completed.finalAccuracy).toBe(actualAccuracy[1]);
        expect(fit.completed.metricKey).toBe('acc');
        expect(fit.completed.logAvailable).toBe(true);
        expect(fit.x.dtype).toBe('float32');
        expect(fit.y.dtype).toBe('float32');
        expect(fit.modelOrdinal).toBe(1);
        expect(fit.callbacksPresent).toBe(false);
        expect(fit.validationDataPresent).toBe(false);
        expect(fit.weights.complete).toBe(true);
        try { fit.completed.points[0].loss = 123; } catch {}
        try { fit.settings.epochs = 456; } catch {}
        expect(fit.completed.points[0].loss).toBe(actualLoss[0]);
        expect(fit.settings.epochs).toBe(2);
      });
    `,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });

  it("records the pinned runtime's actual defaults", async () => {
    const result = await parseAndRunTests(
      setup + "await model.fit(x, y);",
      `
      it('records defaults', () => {
        const fit = tf.__fits[0];
        expect(fit.settings.epochs).toBe(1);
        expect(fit.settings.batchSize).toBe(32);
        expect(fit.settings.shuffle).toBe(true);
        expect(fit.settings.initialEpoch).toBe(0);
        expect(fit.settings.validationSplit).toBe(0);
        expect(fit.completed.completedEpochs).toBe(1);
      });
    `,
    );
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });

  it("keeps only completed history when a training callback rejects", async () => {
    const result = await parseAndRunTests(
      setup +
        `
      let failure;
      try {
        await model.fit(x, y, { epochs: 5, callbacks: {
          onEpochEnd: (epoch) => { if (epoch === 1) throw new Error('Training interrupted'); }
        } });
      } catch (error) { failure = error; }
    `,
      `
      it('captures the completed epoch', () => {
        const fit = tf.__fits[0];
        expect(failure.message).toBe('Training interrupted');
        expect(fit.failed).toBe(true);
        expect(fit.history).toBe(null);
        expect(fit.completed.completedEpochs).toBe(1);
        expect(fit.completed.points.map((point) => point.epoch)).toEqual([1]);
        expect(Number.isFinite(fit.completed.points[0].loss)).toBe(true);
      });
    `,
    );
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });

  it("never reuses an earlier fit's history after a new fit fails before training", async () => {
    const result = await parseAndRunTests(
      setup +
        `
      await model.fit(x, y, { epochs: 2 });
      try { await model.fit(tf.zeros([2, 3]), y, { epochs: 7 }); } catch {}
    `,
      `
      it('keeps the failure separate', () => {
        expect(tf.__fits.length).toBe(2);
        expect(tf.__fits[0].completed.completedEpochs).toBe(2);
        expect(tf.__fits[1].failed).toBe(true);
        expect(tf.__fits[1].completed).toBe(null);
        expect(tf.__fits[1].settings.epochs).toBe(7);
      });
    `,
    );
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });

  it("withholds trusted final metrics when a callback changes epoch logs", async () => {
    const result = await parseAndRunTests(
      setup +
        `
        const history = await model.fit(x, y, { epochs: 2, callbacks: {
          onEpochEnd: (epoch, logs) => { logs.acc = 0.123456; }
        }, validationData: [x, y] });
      `,
      `
        it('keeps callback observations separate', () => {
          const fit = tf.__fits[0];
          expect(history.history.acc[1]).toBe(0.123456);
          expect(fit.callbacksPresent).toBe(true);
          expect(fit.validationDataPresent).toBe(true);
          expect(fit.completed.points.length).toBe(2);
          expect(fit.completed.finalLoss).toBe(null);
          expect(fit.completed.finalAccuracy).toBe(null);
          expect(fit.completed.logAvailable).toBe(false);
        });
      `,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });

  it("retains weight lineage when Sequential recompile replaces the internal model", async () => {
    const result = await parseAndRunTests(
      setup +
        `
        const firstHistory = await model.fit(x, y, { epochs: 1 });
        const firstInternal = model.model;
        model.compile({ optimizer: 'sgd', loss: 'meanSquaredError', metrics: ['accuracy'] });
        const secondHistory = await model.fit(x, y, { epochs: 1 });
      `,
      `
        it('records shared weight-bearing layers and distinct model identities', () => {
          const first = tf.__fits[0], second = tf.__fits[1];
          expect(first.model).toBe(firstInternal);
          expect(second.model).toBe(model.model);
          expect(first.model === second.model).toBe(false);
          expect(first.history).toBe(firstHistory);
          expect(second.history).toBe(secondHistory);
          expect(first.modelOrdinal).toBe(1);
          expect(second.modelOrdinal).toBe(2);
          expect(first.weightLayers.length).toBe(1);
          expect(first.weightLayers[0]).toBe(second.weightLayers[0]);
          expect(model.model.layers.includes(first.weightLayers[0])).toBe(true);
          expect(Object.isFrozen(first.weightLayers)).toBe(true);
        });
      `,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });

  it("retains shared layers across functional models without matching their inputs", async () => {
    const result = await parseAndRunTests(
      `
        const shared = tf.layers.dense({ units: 1 });
        const leftInput = tf.input({ shape: [1] });
        const rightInput = tf.input({ shape: [1] });
        const left = tf.model({ inputs: leftInput, outputs: shared.apply(leftInput) });
        const right = tf.model({ inputs: rightInput, outputs: shared.apply(rightInput) });
        left.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
        right.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
        const x = tf.tensor2d([[0], [1]]), y = tf.tensor2d([[0], [1]]);
        await left.fit(x, y, { epochs: 1 });
        await right.fit(x, y, { epochs: 1 });
      `,
      `
        it('observes the shared Dense layer only', () => {
          const first = tf.__fits[0], second = tf.__fits[1];
          expect(first.model === second.model).toBe(false);
          expect(first.weightLayers.length).toBe(1);
          expect(second.weightLayers.length).toBe(1);
          expect(first.weightLayers[0]).toBe(shared);
          expect(second.weightLayers[0]).toBe(shared);
        });
      `,
    );
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });
});

const createRecorder = new Function(
  "tf",
  `return (${FIT_RECORDING_SOURCE})(tf);`,
) as (runtime: typeof tf) => FitRecorder;
const models: tf.LayersModel[] = [];
const tensors: tf.Tensor[] = [];
const own = <T extends tf.Tensor>(tensor: T): T => {
  tensors.push(tensor);
  return tensor;
};
function makeModel(units = 1, depth = 1) {
  const model = tf.sequential();
  for (let index = 0; index < depth; index++) {
    model.add(
      tf.layers.dense({
        units,
        ...(index === 0 ? { inputShape: [1] } : {}),
        kernelInitializer: "ones",
        biasInitializer: "zeros",
        activation: index === depth - 1 ? "sigmoid" : "linear",
      }),
    );
  }
  model.compile({
    optimizer: "sgd",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });
  models.push(model);
  return model;
}
function inputs() {
  return [own(tf.tensor2d([[0], [1]])), own(tf.tensor2d([[0], [1]]))] as const;
}
function history(length = 1) {
  return {
    epoch: Array.from({ length }, (_, index) => index),
    history: {
      loss: Array.from({ length }, (_, index) => 1 / (index + 1)),
      acc: Array.from({ length }, () => 0.75),
    },
  };
}

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

afterEach(() => {
  tf.dispose(tensors.splice(0));
  for (const model of models.splice(0)) {
    model.dispose();
    model.optimizer.dispose();
  }
});

describe("bounded fit recorder state", () => {
  it("copies immutable weights without allocating or disposing model tensors", () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    const count = tf.memory().numTensors;
    const before = recorder.checkpoint(model);
    expect(tf.memory().numTensors).toBe(count);
    expect(before).toEqual({
      complete: true,
      reason: null,
      parameters: 2,
      tensors: [
        { shape: [1, 1], dtype: "float32", values: [1] },
        { shape: [1], dtype: "float32", values: [0] },
      ],
    });
    if (!before.complete) throw new Error("Expected a complete checkpoint");
    expect(() => {
      (before.tensors[0]!.values as number[])[0] = 9;
    }).toThrow();
    expect(() => {
      (before.tensors[0]!.shape as number[])[0] = 9;
    }).toThrow();
    expect(() => {
      (before.tensors as unknown[]).push({});
    }).toThrow();
    const replacement = model
      .getWeights()
      .map((weight) => own(tf.zerosLike(weight)));
    model.setWeights(replacement);
    const after = recorder.checkpoint(model);
    expect(before.tensors[0]!.values).toEqual([1]);
    expect(after.complete && after.tensors[0]!.values).toEqual([0]);
    expect(
      own(model.predict(own(tf.ones([1, 1]))) as tf.Tensor).dataSync()[0],
    ).toBe(0.5);
  });

  it("accepts the exact weight limits and refuses larger checkpoints", () => {
    const recorder = createRecorder(tf);
    const atValueLimit = recorder.checkpoint(makeModel(4096));
    expect(atValueLimit.complete).toBe(true);
    expect(atValueLimit.parameters).toBe(8192);
    expect(recorder.checkpoint(makeModel(4097))).toMatchObject({
      complete: false,
      reason: "over-limit",
      parameters: 8194,
      tensors: null,
    });
    const atTensorLimit = recorder.checkpoint(makeModel(1, 16));
    expect(atTensorLimit.complete && atTensorLimit.tensors.length).toBe(32);
    expect(recorder.checkpoint(makeModel(1, 17))).toMatchObject({
      complete: false,
      reason: "over-limit",
      tensors: null,
    });
  });

  it("rejects non-finite weights and unreadable models without changing them", () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    model.setWeights([own(tf.tensor2d([[NaN]])), own(tf.zeros([1]))]);
    expect(recorder.checkpoint(model)).toMatchObject({
      complete: false,
      reason: "nonfinite-weight",
      tensors: null,
    });
    expect(Number.isNaN(model.getWeights()[0]!.dataSync()[0])).toBe(true);
    models.splice(models.indexOf(model), 1);
    model.dispose();
    model.optimizer.dispose();
    expect(recorder.checkpoint(model)).toMatchObject({
      complete: false,
      reason: "unreadable-weights",
      tensors: null,
    });
    expect(recorder.checkpoint({ getWeights: () => [] })).toMatchObject({
      complete: false,
      reason: "model-unavailable",
      tensors: null,
    });
  });

  it("records synchronous throws and rejected fits without leaving pending slots", async () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    const [x, y] = inputs();
    const error = new Error("Training failed");
    const sync = recorder.wrap((_x: tf.Tensor, _y: tf.Tensor) => {
      throw error;
    });
    expect(() => sync.call(model, x, y)).toThrow(error);
    const reject = recorder.wrap((_x: tf.Tensor, _y: tf.Tensor) =>
      Promise.reject(error),
    );
    await expect(reject.call(model, x, y)).rejects.toBe(error);
    expect(recorder.read()).toHaveLength(2);
    for (const fit of recorder.read()) {
      expect(fit).toMatchObject({
        failed: true,
        pending: false,
        history: null,
        completed: null,
        modelOrdinal: 1,
      });
    }
    expect(recorder.status()).toMatchObject({
      recordedFits: 2,
      attemptedFits: 2,
      pendingFits: 0,
      failedFits: 2,
      overflow: false,
    });
  });

  it("keeps pending observations and late completions inside their original run", async () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    const [x, y] = inputs();
    let resolve!: (value: ReturnType<typeof history>) => void;
    const fit = recorder.wrap(
      (_x: tf.Tensor, _y: tf.Tensor) =>
        new Promise<ReturnType<typeof history>>((done) => {
          resolve = done;
        }),
    );
    const pending = fit.call(model, x, y);
    expect(recorder.read()).toEqual([null]);
    const oldStatus = recorder.status();
    expect(oldStatus.pendingFits).toBe(1);
    expect(Object.isFrozen(oldStatus)).toBe(true);
    recorder.reset();
    const returned = history();
    resolve(returned);
    expect(await pending).toBe(returned);
    expect(oldStatus.pendingFits).toBe(1);
    expect(recorder.read()).toEqual([]);
    expect(recorder.status()).toEqual({
      recordedFits: 0,
      attemptedFits: 0,
      pendingFits: 0,
      failedFits: 0,
      overflow: false,
      unsupported: false,
    });
  });

  it("reports overflow while retaining a bounded history and stable model ordinals", async () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    const other = makeModel();
    const [x, y] = inputs();
    const fit = recorder.wrap((_x: tf.Tensor, _y: tf.Tensor) => history());
    for (let index = 0; index < 17; index++)
      await fit.call(index === 1 ? other : model, x, y);
    expect(recorder.read()).toHaveLength(16);
    expect(recorder.read().map((item) => item?.modelOrdinal)).toEqual([
      1,
      2,
      ...Array(14).fill(1),
    ]);
    expect(recorder.status()).toEqual({
      recordedFits: 16,
      attemptedFits: 17,
      pendingFits: 0,
      failedFits: 0,
      overflow: true,
      unsupported: false,
    });
    recorder.reset();
    await fit.call(other, x, y);
    expect(recorder.read()[0]?.modelOrdinal).toBe(1);
    expect(recorder.status().overflow).toBe(false);
  });

  it("exposes missing input coverage without copying oversized tensors", async () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    const large = own(tf.zeros([8193, 1]));
    const y = own(tf.ones([2, 1]));
    const fit = recorder.wrap((_x: tf.Tensor, _y: tf.Tensor) => history());
    await fit.call(model, large, y);
    expect(recorder.read()[0]?.x).toEqual({
      shape: [8193, 1],
      dtype: "float32",
      complete: false,
      values: null,
    });
    expect(recorder.status().unsupported).toBe(true);
    recorder.reset();
    // A changed public size field must not bypass the copied-value bound.
    const originalSize = large.size;
    (large as unknown as { size: number }).size = 1;
    try {
      await fit.call(model, large, y);
    } finally {
      (large as unknown as { size: number }).size = originalSize;
    }
    expect(recorder.read()[0]?.x).toMatchObject({
      complete: false,
      values: null,
    });
    expect(recorder.status().unsupported).toBe(true);
  });

  it("preserves historical loss sampling while copying final metrics separately", async () => {
    const recorder = createRecorder(tf);
    const model = makeModel();
    const [x, y] = inputs();
    const returned = history(140);
    const fit = recorder.wrap((_x: tf.Tensor, _y: tf.Tensor) => returned);
    await fit.call(model, x, y);
    returned.history.loss[139] = 99;
    returned.history.acc[139] = 0.1;
    const completed = recorder.read()[0]?.completed;
    expect(completed?.points.map((point) => point.epoch)).toEqual(
      Array.from(
        { length: 64 },
        (_, index) => Math.round((index * 139) / 63) + 1,
      ),
    );
    expect(completed).toMatchObject({
      completedEpochs: 140,
      finiteEpochs: 140,
      sampled: true,
      finalLoss: 1 / 140,
      finalAccuracy: 0.75,
      metricKey: "acc",
      logAvailable: true,
    });
  });
});
