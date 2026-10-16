import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { BRIDGES } from "./bridges";

const snippet = (id: number) => {
  const code = BRIDGES.find((bridge) => bridge.id === id)?.mlCode;
  if (!code) throw new Error(`Missing bridge ${id} ML example`);
  return code;
};

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

let baseline: number;
beforeEach(() => {
  baseline = tf.memory().numTensors;
});
afterEach(() => {
  expect(tf.memory().numTensors).toBe(baseline);
});

describe("bridge examples against TensorFlow.js 4.22", () => {
  it.each([5, 25])(
    "bridge %i updates real SGD learning rates during fitting",
    async (id) => {
      const model = tf.sequential();
      model.add(
        tf.layers.dense({
          units: 1,
          inputShape: [1],
          useBias: false,
          kernelInitializer: "zeros",
        }),
      );
      const x = tf.ones([1, 1]);
      const y = tf.ones([1, 1]);
      try {
        const execute = new Function(
          "tf",
          "model",
          "x",
          "y",
          `return (async () => { ${snippet(id)} })();`,
        );
        await execute(tf, model, x, y);
        const epochs = id === 5 ? 50 : 30;
        let expectedWeight = 0;
        for (let epoch = 0; epoch < epochs; epoch++) {
          const rate = 0.01 * 0.5 ** Math.floor(epoch / 10);
          expectedWeight += rate * 2 * (1 - expectedWeight);
        }
        expect(model.optimizer.iterations).toBe(epochs);
        expect(model.getWeights()[0].dataSync()[0]).toBeCloseTo(
          expectedWeight,
          5,
        );
      } finally {
        model.optimizer?.dispose();
        model.dispose();
        tf.dispose([x, y]);
      }
    },
  );

  it("backpropagation returns a local derivative and leaves step size to the optimizer", () => {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 1,
        inputShape: [1],
        useBias: false,
        kernelInitializer: "ones",
      }),
    );
    const x = tf.tensor2d([[2]]);
    const y = tf.zeros([1, 1]);
    const optimizer = tf.train.sgd(0.01);
    let result: { value: tf.Scalar; grads: tf.NamedTensorMap } | undefined;
    try {
      const execute = new Function(
        "tf",
        "model",
        "x",
        "y",
        "lossFn",
        `${snippet(15)}\nreturn { value, grads };`,
      );
      result = execute(tf, model, x, y, tf.losses.meanSquaredError);
      expect(result!.value.dataSync()[0]).toBe(4);
      expect(Object.values(result!.grads)[0].dataSync()[0]).toBe(8);
      optimizer.applyGradients(result!.grads);
      expect(model.getWeights()[0].dataSync()[0]).toBeCloseTo(0.92, 6);
    } finally {
      if (result) tf.dispose([result.value, ...Object.values(result.grads)]);
      tf.dispose([x, y]);
      optimizer.dispose();
      model.dispose();
    }
  });

  it("inverted dropout rescales kept training activations and passes inference values through", () => {
    const layer = tf.layers.dropout({ rate: 0.5, seed: 7 });
    const input = tf.ones([1, 128]);
    try {
      const { training, inference } = tf.tidy(() => ({
        training: Array.from(
          (layer.apply(input, { training: true }) as tf.Tensor).dataSync(),
        ),
        inference: Array.from(
          (layer.apply(input, { training: false }) as tf.Tensor).dataSync(),
        ),
      }));
      expect(new Set(training)).toEqual(new Set([0, 2]));
      expect(inference).toEqual(Array(128).fill(1));
      const js = BRIDGES.find((bridge) => bridge.id === 18)!.variants!.react!
        .jsCode;
      let index = 0;
      const evaluate = new Function(
        "Math",
        `${js}\nreturn dropout([1, 1], 0.5);`,
      );
      expect(evaluate({ random: () => [0.1, 0.9][index++] })).toEqual([0, 2]);
    } finally {
      input.dispose();
      layer.dispose();
    }
  });

  it("finite float32 logits can produce an exact zero softmax score", () => {
    tf.tidy(() => {
      const logits = tf.tensor2d([[-1000, 0]]);
      const execute = new Function(
        "tf",
        "logits",
        `${snippet(26)}\nreturn scores;`,
      );
      const scores = execute(tf, logits) as tf.Tensor;
      expect(scores.arraySync()).toEqual([[0, 1]]);
      expect(scores.sum().dataSync()[0]).toBe(1);
    });
  });

  it("batch normalization uses its stored statistics for a multi-example inference batch", () => {
    const layer = tf.layers.batchNormalization({ momentum: 0, epsilon: 0.001 });
    const train = tf.tensor2d([[1], [3]]);
    const later = tf.tensor2d([[10], [14]]);
    try {
      tf.tidy(() => {
        layer.apply(train, { training: true });
      });
      const [gamma, beta, mean, variance] = layer
        .getWeights()
        .map((weight) => weight.dataSync()[0]);
      expect(mean).toBe(2);
      const actual = tf.tidy(() =>
        Array.from(
          (layer.apply(later, { training: false }) as tf.Tensor).dataSync(),
        ),
      );
      actual.forEach((value, i) => {
        const expected =
          (gamma * ([10, 14][i] - mean)) / Math.sqrt(variance + 0.001) + beta;
        expect(value).toBeCloseTo(expected, 5);
      });
      expect(actual.every((value) => value > 1)).toBe(true);
      expect(layer.getWeights()[2].dataSync()[0]).toBe(2);
    } finally {
      tf.dispose([train, later]);
      layer.dispose();
    }
  });

  it("magnitude pruning changes values without shrinking dense storage", () => {
    const weights = tf.tensor1d([-0.1, 0.5, -0.8, 0.01]);
    let pruned: tf.Tensor | undefined;
    try {
      const bytes = tf.memory().numBytes;
      const execute = new Function(
        "tf",
        "weights",
        "threshold",
        `${snippet(47)}\nreturn pruned;`,
      );
      pruned = execute(tf, weights, 0.5);
      Array.from(pruned!.dataSync()).forEach((value, i) => {
        expect(value).toBeCloseTo([0, 0.5, -0.8, 0][i], 6);
      });
      expect(pruned!.shape).toEqual(weights.shape);
      expect(pruned!.dtype).toBe("float32");
      expect(tf.memory().numBytes - bytes).toBe(weights.size * 4);
      expect(Array.from(weights.dataSync())[0]).toBeCloseTo(-0.1, 6);
    } finally {
      pruned?.dispose();
      weights.dispose();
    }
  });

  it("uint8 weight storage decodes to float32 tensors in the TFJS loader", () => {
    const encoded = new Uint8Array([0, 127, 255]);
    const bytes = tf.memory().numBytes;
    const decoded = tf.io.decodeWeights(encoded.buffer, [
      {
        name: "weights",
        shape: [3],
        dtype: "float32",
        quantization: { dtype: "uint8", min: -1, scale: 2 / 255 },
      },
    ]);
    try {
      expect(encoded.byteLength).toBe(3);
      expect(decoded.weights.dtype).toBe("float32");
      expect(tf.memory().numBytes - bytes).toBe(12);
      expect(decoded.weights.dataSync()[0]).toBe(-1);
      expect(decoded.weights.dataSync()[2]).toBe(1);
    } finally {
      tf.dispose(decoded);
    }
  });

  it("early stopping does not implement automatic best-weight restoration in this version", () => {
    expect(() =>
      tf.callbacks.earlyStopping({ restoreBestWeights: true }),
    ).toThrow(/not implemented/i);
  });
});
