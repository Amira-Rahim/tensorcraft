// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(
  new URL("../../ui/package.json", import.meta.url),
);
const tf = require("@tensorflow/tfjs");

// Execute the examples learners receive, not copies of their arithmetic.
function snippet(file: string, title: string, world = "deep-orbit"): string {
  const source = readFileSync(
    new URL(`../content/${world}/${file}`, import.meta.url),
    "utf8",
  );
  const heading = source.indexOf(`title="${title}"`);
  if (heading < 0) throw new Error(`Missing example ${title}`);
  const start = source.indexOf("{`", heading);
  const end = source.indexOf("`}", start);
  const literal = source.slice(start + 1, end + 1);
  return new Function(`return ${literal};`)();
}

function javascript(source: string) {
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
}

describe("educational counterexamples and evidence boundaries", () => {
  it("distinguishes squared MAE from error variance using the lesson example", () => {
    const code = snippet(
      "advanced-time-series/05-ensemble-methods.mdx",
      "mae-is-not-variance.js",
    );
    const { biased, varying } = new Function(
      `${code}\nreturn { biased, varying };`,
    )();
    expect(biased).toEqual({ mae: 1, variance: 0 });
    expect(varying).toEqual({ mae: 1, variance: 1 });
  });

  it("shows an off-bin tone spreading beyond its two nearest bins without leaking tensors", () => {
    const before = tf.memory().numTensors;
    const code = snippet(
      "signal-processing/01-time-vs-frequency.mdx",
      "between-bins.js",
    );
    const { onBin, betweenBins, visibleBins } = new Function(
      "tf",
      "console",
      `${code}\nreturn { onBin, betweenBins, visibleBins };`,
    )(tf, { log: vi.fn() });
    expect(visibleBins(onBin)).toBe(1);
    expect(visibleBins(betweenBins)).toBe(33);
    expect(tf.memory().numTensors).toBe(before);
  });

  it("uses different output dimensions for a classifier and image generator", () => {
    const code = snippet(
      "generative-basics/01-what-is-generative-ai.mdx",
      "model-shapes.ts",
      "nova-canvas",
    ).replace(/^import .*$/gm, "");
    const { classifier, generator } = new Function(
      "tf",
      "console",
      `${javascript(code)}\nreturn { classifier, generator };`,
    )(tf, { log: vi.fn() });
    try {
      expect(classifier.inputs[0].shape).toEqual([null, 784]);
      expect(classifier.outputShape).toEqual([null, 1]);
      expect(generator.inputs[0].shape).toEqual([null, 100]);
      expect(generator.outputShape).toEqual([null, 784]);
    } finally {
      classifier.dispose();
      generator.dispose();
    }
  });

  it("matches same-padding dimensions against the installed convolution runtime", () => {
    const code = snippet(
      "convolutional-neural-networks/01-convolution-operations.mdx",
      "padding-and-strides.ts",
      "neon-protocol",
    );
    const calculateOutputSize = new Function(
      "console",
      `${javascript(code)}\nreturn calculateOutputSize;`,
    )({ log: vi.fn() });
    tf.tidy(() => {
      for (const size of [4, 5, 9])
        for (const stride of [1, 2])
          for (const padding of ["valid", "same"]) {
            const result = tf.conv2d(
              tf.ones([1, size, size, 1]),
              tf.ones([3, 3, 1, 1]),
              stride,
              padding,
            );
            expect(calculateOutputSize(size, 3, stride, padding)).toBe(
              result.shape[1],
            );
          }
    });
  });

  it("keeps the one-release Gaussian bound within its stated parameter range", () => {
    const code = snippet(
      "federated-learning/03-privacy-preservation.mdx",
      "one-release-noise.ts",
      "terra-grid",
    );
    const oneReleaseSigma = new Function(
      `${javascript(code)}\nreturn oneReleaseSigma;`,
    )();
    expect(oneReleaseSigma(2, 0.5, 1e-5)).toBeCloseTo(
      2 * oneReleaseSigma(1, 0.5, 1e-5),
    );
    expect(oneReleaseSigma(1, 0.25, 1e-5)).toBeCloseTo(
      2 * oneReleaseSigma(1, 0.5, 1e-5),
    );
    for (const epsilon of [0, 1, 10, NaN])
      expect(() => oneReleaseSigma(1, epsilon, 1e-5)).toThrow();
    expect(() => oneReleaseSigma(Infinity, 0.5, 1e-5)).toThrow();
    expect(() => oneReleaseSigma(1, 0.5, 0)).toThrow();
  });

  it("uses the stated memory threshold in the clinical monitoring example", () => {
    const code = snippet(
      "capstone/05-launch-day.mdx",
      "monitoring.ts",
      "signal-ward",
    );
    const Monitor = new Function(
      "config",
      `${javascript(code)}\nreturn DiagnosticOneMonitor;`,
    )({
      rollbackThreshold: { errorRate: 0.05, latencyP95: 500, memoryMB: 512 },
    });
    const monitor = new Monitor();
    expect(monitor.shouldRollback()).toBe(false);
    monitor.recordMemory(600);
    expect(monitor.shouldRollback()).toBe(true);
  });

  it("represents XOR with two ReLU units without relying on a training run", () => {
    const code = snippet(
      "neural-networks/03-layers-and-architecture.mdx",
      "xor-capacity.js",
    );
    expect(new Function(`${code}\nreturn outputs;`)()).toEqual([0, 1, 1, 0]);
  });

  it("preserves a ReLU function while changing the magnitude of its weights", () => {
    const code = snippet(
      "optimization-edge/03-pruning.mdx",
      "weight-rescaling.js",
    );
    const { originalOutput, rescaledOutput } = new Function(
      `${code}\nreturn { originalOutput, rescaledOutput };`,
    )();
    for (const x of [-1000, -1, 0, 0.05, 1, 1000]) {
      expect(rescaledOutput(x)).toBeCloseTo(originalOutput(x), 8);
    }
  });

  it("holds later telemetry out even when training indices are shuffled", () => {
    const code = snippet(
      "foundations/04-data-loading.mdx",
      "train-test-split.ts",
    );
    const { trainIdx, valIdx } = new Function(
      "tf",
      `${javascript(code)}; return { trainIdx, valIdx };`,
    )(tf);
    expect(trainIdx.length).toBe(23_040);
    expect(valIdx.length).toBe(5_760);
    expect(Math.max(...trainIdx)).toBeLessThan(Math.min(...valIdx));
    expect(new Set([...trainIdx, ...valIdx]).size).toBe(28_800);
  });

  it("demonstrates both a missed anomaly and a normal false alarm", () => {
    const code = snippet(
      "anomaly-detection/03-reconstruction-error.mdx",
      "reconstruction-counterexample.js",
    );
    const result = new Function(
      `${code}\n; return { distantAnomalyError, ordinaryNoisyError };`,
    )();
    expect(result.distantAnomalyError).toBe(0);
    expect(result.ordinaryNoisyError).toBeCloseTo(0.02);
    expect(result.distantAnomalyError > 0.01).toBe(false);
    expect(result.ordinaryNoisyError > 0.01).toBe(true);
  });

  it("shows F1 preferring more errors even when every error has equal cost", () => {
    const code = snippet(
      "anomaly-detection/04-threshold-tuning.mdx",
      "f1-and-cost.js",
    );
    const { candidates, comparisons } = new Function(
      `${code}\n; return { candidates, comparisons };`,
    )();
    for (const c of candidates) {
      expect(c.tp + c.fn).toBe(20);
      expect(c.fp + c.tn).toBe(80);
    }
    expect(comparisons[1].f1).toBeGreaterThan(comparisons[0].f1);
    expect(comparisons[1].equalCost).toBe(15);
    expect(comparisons[0].equalCost).toBe(12);
  });

  it("keeps a prose report withheld until the reviewer explicitly approves it", async () => {
    const code = snippet(
      "llm-integration/04-report-generation.mdx",
      "report-pipeline.ts",
    ).split("// Define the report template")[0];
    const generateReport = new Function(
      `${javascript(code)}; return generateReport;`,
    )();
    const llm = {
      complete: vi
        .fn()
        .mockResolvedValue(
          "The signal is safe. We recorded 73.4 events at 14 Hz.",
        ),
    };
    const review = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const sections = [
      {
        heading: "Unreviewed",
        data: "14 events at 73.4 Hz",
        prompt: "Summarize",
      },
      { heading: "Reviewed", data: "Other evidence", prompt: "Summarize" },
    ];
    const result = await generateReport(sections, llm, review);
    expect(result.map((s: { validated: boolean }) => s.validated)).toEqual([
      false,
      true,
    ]);
    expect(review).toHaveBeenCalledWith({
      heading: "Unreviewed",
      draft: await llm.complete.mock.results[0].value,
      evidence: "14 events at 73.4 Hz",
    });
  });

  it("runs the limited numeric screen without treating matches as verified claims", () => {
    const code = snippet(
      "llm-integration/01-llms-for-science.mdx",
      "workflow.ts",
    );
    const screenNumbers = new Function(
      "console",
      `${javascript(code)}\nreturn screenNumbers;`,
    )({ log: vi.fn() });
    expect(
      screenNumbers("73.4 events at 14 Hz", { count: 14, frequency: 73.4 }),
    ).toEqual({
      matched: [73.4, 14],
      unmatched: [],
    });
    expect(screenNumbers("The signal is safe", {})).toEqual({
      matched: [],
      unmatched: [],
    });
  });

  it("publishes measured alerts while holding unreviewed model prose separately", async () => {
    const code = snippet(
      "llm-integration/05-multi-model-systems.mdx",
      "pipeline.ts",
    ).replace(/import \* as tf from '@tensorflow\/tfjs';/, "");
    const processSignal = new Function(
      "tf",
      `${javascript(code)}\nreturn processSignal;`,
    )(tf);
    const draft = "The signal is safe. No action is required.";
    const models = {
      classifier: { predict: () => tf.tensor2d([[0.8]]) },
      autoencoder: { predict: () => tf.zeros([1, 11]) },
      lstm: { predict: () => tf.tensor2d([[0, 0, 0]]), outputShape: [null, 3] },
      llm: { complete: vi.fn().mockResolvedValue(draft) },
    };
    const result = await processSignal(
      [0.1, 0.2, 0.3],
      Array(11).fill(1),
      Array.from({ length: 80 }, () => [0, 0, 0]),
      models,
      { anomaly: 0.5 },
    );
    expect(result.anomaly.isAnomaly).toBe(true);
    expect(result.report).toContain("1.0000");
    expect(result.report).not.toContain(draft);
    expect(result.draftForReview).toBe(draft);
  });
});
