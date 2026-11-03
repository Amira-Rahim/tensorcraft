// @vitest-environment node
import { describe, expect, it } from "vitest";
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
      options.epochs = 999;
      history.history.loss[0] = 999;
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
});
