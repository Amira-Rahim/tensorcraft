// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import ts from "typescript";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import {
  ANOMALY_CLARITY,
  CALM_VOTE_WINDOW,
  RECONSTRUCTION_ROWS,
  SCREENING_ROWS,
  thresholdTrace,
  voteWindowStats,
} from "./anomaly-clarity-investigations";
import {
  EVALUATION_MEMBERS,
  EVALUATION_TARGETS,
  feedbackReference,
  forecastBlendTrace,
  kalmanLogTrace,
  POSITIONAL_READINGS,
  POSITIONAL_STRONG_READINGS,
  PULSE_INTERVAL_LOG,
  positionalTrace,
  queryValueTrace,
  TIME_SERIES_CLARITY,
} from "./time-series-clarity-investigations";
import {
  clampInvestigationValues,
  initialInvestigationValues,
  investigationControlMax,
} from "./investigation-types";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";

const require = createRequire(
  new URL("../../../../../packages/content/package.json", import.meta.url),
);
const { parse } = createRequire(require.resolve("velite"))("yaml");
const root = new URL(
  "../../../../../packages/content/content/deep-orbit/",
  import.meta.url,
);
const exercises = [
  ["anomaly-detection", "detect-anomaly", "isAnomaly"],
  ["anomaly-detection", "incident-baseline-drift", "auditBaseline"],
  ["anomaly-detection", "build-autoencoder", "trainNormalityModel"],
  ["anomaly-detection", "reconstruction-error", "reconstructionError"],
  ["anomaly-detection", "incident-missed-anomaly", "auditReconstruction"],
  ["anomaly-detection", "find-threshold", "findBestThreshold"],
  ["anomaly-detection", "incident-false-alarm-storm", "diagnoseStorm"],
  ["anomaly-detection", "ensemble-detector", "detectAnomalyEnsemble"],
  ["advanced-time-series", "simple-attention", "simpleAttention"],
  ["advanced-time-series", "temporal-attention", "temporalAttention"],
  ["advanced-time-series", "forecast-signal", "forecastTwoWays"],
  ["advanced-time-series", "kalman-filter", "SimpleKalman"],
  ["advanced-time-series", "weighted-ensemble", "ensembleGain"],
] as const;
const source = (
  module: string,
  slug: string,
): { solutionCode: string; testCode: string; starterCode: string } =>
  parse(
    readFileSync(new URL(`${module}/exercises/${slug}.yaml`, root), "utf8"),
  );
function solution<T>(module: string, slug: string, name: string): T {
  const js = ts.transpileModule(
    source(module, slug).solutionCode.replace(
      /^\s*import \* as tf from [^;]+;/m,
      "",
    ),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.None,
      },
    },
  ).outputText;
  return new Function("tf", `${js}\nreturn ${name};`)(tf) as T;
}
beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("the ten anomaly and time-series investigations", () => {
  it("keeps every case and bounded control trace finite, selectable, and executable", () => {
    const specs = { ...ANOMALY_CLARITY, ...TIME_SERIES_CLARITY };
    expect(Object.keys(specs)).toHaveLength(10);
    for (const [slug, spec] of Object.entries(specs)) {
      expect(DEEP_ORBIT_VISUALS[slug]!.kind).toBe("flow");
      expect(DEEP_ORBIT_VISUALS[slug]!.stages).toHaveLength(3);
      for (const item of spec.cases) {
        const values = initialInvestigationValues(spec, item.id);
        const variants = spec.controls.flatMap((control) =>
          (control.kind === "choice"
            ? control.options!.map((option) => option.value)
            : [control.min!, investigationControlMax(control, values)!]
          ).map((value) =>
            clampInvestigationValues(spec, { ...values, [control.id]: value }),
          ),
        );
        for (const variant of [values, ...variants]) {
          const result = spec.evaluate(variant, item.id);
          if (typeof result.answer === "number")
            expect(Number.isFinite(result.answer), slug).toBe(true);
          expect(result.graphics.length).toBeGreaterThan(1);
          if (result.code)
            expect(() => new Function(result.code!)).not.toThrow();
          for (const graphic of result.graphics)
            for (const value of graphic.values)
              if (typeof value === "number")
                expect(
                  Number.isFinite(value),
                  `${slug}: ${graphic.label}`,
                ).toBe(true);
        }
      }
    }
  });

  it("matches strict baseline decisions, reconstruction MSE, and supplied validation labels", () => {
    const flag = solution<
      (value: number, mean: number, std: number) => boolean
    >("anomaly-detection", "detect-anomaly", "isAnomaly");
    for (const [value, mean, std] of [
      [100, 50, 10],
      [80, 50, 10],
      [50, 50, 0],
      [51, 50, 0],
    ]) {
      const spec = ANOMALY_CLARITY["normal-vs-anomalous"]!;
      expect(
        spec.evaluate(
          { value: value!, center: mean!, spread: std! },
          "standard",
        ).answer,
      ).toBe(flag(value!, mean!, std!) ? "flag" : "no flag");
    }
    const reconstruction = solution<(model: unknown, row: number[]) => number>(
      "anomaly-detection",
      "reconstruction-error",
      "reconstructionError",
    );
    const before = tf.memory().numTensors;
    for (const row of RECONSTRUCTION_ROWS)
      for (const mapping of [0, 1, 2]) {
        const model = {
          predict: (input: tf.Tensor) =>
            mapping === 0
              ? input.add(0.1)
              : mapping === 1
                ? tf.zerosLike(input)
                : input.clone(),
        };
        const value = reconstruction(model, row);
        const spec = ANOMALY_CLARITY["reconstruction-error"]!;
        const reference = spec.evaluate(
          { feature: 3, mapping },
          row === RECONSTRUCTION_ROWS[0] ? "standard" : "changed",
        );
        expect(value).toBeCloseTo(reference.answer as number, 6);
      }
    expect(tf.memory().numTensors).toBe(before);
    const choose = solution<
      (
        errors: number[],
        labels: boolean[],
        candidates: number[],
      ) => { threshold: number; f1: number }
    >("anomaly-detection", "find-threshold", "findBestThreshold");
    const errors = [0.2, 0.4, 0.5, 0.7, 0.9, 0.3],
      labels = [false, true, false, true, true, false];
    expect(thresholdTrace(errors, labels, 0.3)).toMatchObject({
      tp: 3,
      fp: 1,
      fn: 0,
      tn: 2,
    });
    expect(thresholdTrace(errors, labels, 0.3).f1).toBeCloseTo(6 / 7, 12);
    expect(thresholdTrace(errors, labels, 0.6).f1).toBe(0.8);
    expect(choose(errors, labels, [0.3, 0.6])).toEqual({
      threshold: 0.3,
      f1: 6 / 7,
    });
    expect([2, 3]).toContain(
      choose([0.1, 0.2], [true, false], [2, 3]).threshold,
    );
  });

  it("screens the supplied rows before fitting and releases its temporary input on success and failure", async () => {
    const train = solution<
      (
        rows: number[][],
        flags: boolean[],
        model: unknown,
      ) => Promise<{ model: unknown; history: unknown }>
    >("anomaly-detection", "build-autoencoder", "trainNormalityModel");
    const before = tf.memory().numTensors;
    let retained: tf.Tensor | undefined;
    const history = { history: { loss: [1, 0.5] } };
    const model = {
      fit: async (xs: tf.Tensor, ys: tf.Tensor, options: unknown) => {
        retained = xs;
        expect(xs).toBe(ys);
        expect(xs.arraySync()).toEqual([SCREENING_ROWS[0], SCREENING_ROWS[2]]);
        expect(options).toMatchObject({ epochs: 400, batchSize: 16 });
        return history;
      },
      dispose: () => {
        throw Error("Caller model must stay alive");
      },
    };
    const result = await train(SCREENING_ROWS, [false, true, false], model);
    expect(result).toEqual({ model, history });
    expect(retained!.isDisposed).toBe(true);
    const failure = new Error("fit probe failure");
    await expect(
      train(SCREENING_ROWS, [false, true, false], {
        ...model,
        fit: async (xs: tf.Tensor) => {
          retained = xs;
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
    expect(retained!.isDisposed).toBe(true);
    await expect(train(SCREENING_ROWS, [false], model)).rejects.toThrow(
      "Mismatched flags",
    );
    await expect(
      train(SCREENING_ROWS, [true, true, true], model),
    ).rejects.toThrow("No training rows");
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches real float32 moments and separate votes, including constant and lost-precision windows", () => {
    const detect = solution<
      (
        w: number[],
        a: number,
        r: number,
        c: number,
        p: number,
        t: number,
      ) => { zScore: number | null; votes: number }
    >("anomaly-detection", "ensemble-detector", "detectAnomalyEnsemble");
    const before = tf.memory().numTensors;
    for (const window of [
      CALM_VOTE_WINDOW,
      [0.25, 0.35, 0.25, 0.35, 0.25, 0.35, 0.25, 0.35],
      [0.5, 0.5, 0.5, 0.5],
    ]) {
      const actual = tf.tidy(() => {
        const stats = tf.moments(tf.tensor1d(window));
        return {
          mean: stats.mean.dataSync()[0]!,
          std: Math.sqrt(stats.variance.dataSync()[0]!),
        };
      });
      expect(voteWindowStats(window).mean).toBe(actual.mean);
      expect(voteWindowStats(window).std).toBeCloseTo(actual.std, 10);
    }
    for (const item of ANOMALY_CLARITY["the-anomaly"]!.cases) {
      const spec = ANOMALY_CLARITY["the-anomaly"]!,
        values = initialInvestigationValues(spec, item.id);
      const window =
        item.id === "constant"
          ? [0.5, 0.5, 0.5, 0.5]
          : item.id === "changed"
            ? [0.25, 0.35, 0.25, 0.35, 0.25, 0.35, 0.25, 0.35]
            : CALM_VOTE_WINDOW;
      const result = detect(
        window,
        values.actual!,
        values.reconstruction!,
        values.reconCutoff!,
        values.forecast!,
        values.forecastCutoff!,
      );
      expect(spec.evaluate(values, item.id).answer).toBe(result.votes);
    }
    expect(() => detect([1, 1 + 1e-10], 1, 0, 1, 1, 0.1)).toThrow();
    expect(tf.memory().numTensors).toBe(before);
  });

  it("uses real query/key/value tensors with unequal widths and retains a one-feature output", () => {
    const attention = solution<
      (q: tf.Tensor, k: tf.Tensor, v: tf.Tensor) => tf.Tensor
    >("advanced-time-series", "simple-attention", "simpleAttention");
    const before = tf.memory().numTensors;
    for (const [q, keys, values] of [
      [
        [1, 0],
        [
          [1, 0],
          [0, 1],
        ],
        [
          [2, 0],
          [0, 2],
        ],
      ],
      [
        [1, 2, -1],
        [
          [1, 0, 1],
          [0, 1, 0],
        ],
        [
          [2, 0],
          [0, 2],
        ],
      ],
      [
        [1, 0],
        [
          [1, 0],
          [0, 1],
        ],
        [[2], [4]],
      ],
    ] as [number[], number[][], number[][]][]) {
      const expected = queryValueTrace(q, keys, values);
      tf.tidy(() => {
        const out = attention(
          tf.tensor1d(q),
          tf.tensor2d(keys),
          tf.tensor2d(values),
        );
        expect(out.shape).toEqual([values[0]!.length]);
        Array.from(out.dataSync()).forEach((value, i) =>
          expect(value).toBeCloseTo(expected.output[i]!, 6),
        );
      });
      const reversed = queryValueTrace(
        q,
        [...keys].reverse(),
        [...values].reverse(),
      );
      reversed.output.forEach((value, i) =>
        expect(value).toBeCloseTo(expected.output[i]!, 12),
      );
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches position scoring and original-feature pooling for both fixtures, T=1, and d=1", () => {
    const attention = solution<
      (
        rows: tf.Tensor,
        scorer: tf.Tensor,
      ) => { weights: tf.Tensor; summary: tf.Tensor }
    >("advanced-time-series", "temporal-attention", "temporalAttention");
    const before = tf.memory().numTensors;
    for (const [rows, scorer] of [
      [POSITIONAL_READINGS, [1, 0, 0.5]],
      [POSITIONAL_STRONG_READINGS, [0, 0, 20]],
      [[[4, 7]], [1, 0, 9]],
      [
        [[1], [3], [5]],
        [0, 1],
      ],
    ] as [number[][], number[]][]) {
      const expected = positionalTrace(rows, scorer);
      tf.tidy(() => {
        const out = attention(
          tf.tensor2d(rows),
          tf.tensor2d(scorer.map((x) => [x])),
        );
        expect(out.weights.shape).toEqual([rows.length]);
        expect(out.summary.shape).toEqual([rows[0]!.length]);
        Array.from(out.weights.dataSync()).forEach((value, i) =>
          expect(value).toBeCloseTo(expected.weights[i]!, 6),
        );
        Array.from(out.summary.dataSync()).forEach((value, i) =>
          expect(value).toBeCloseTo(expected.summary[i]!, 5),
        );
      });
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches feedback windows with the actual supplied-model forecast function", async () => {
    const forecast = solution<
      (
        x: tf.Tensor,
        y: tf.Tensor,
        past: number[],
        arrived: number[],
        epochs: number,
        model: unknown,
      ) => Promise<{ rollout: number[]; oneStep: number[] }>
    >("advanced-time-series", "forecast-signal", "forecastTwoWays");
    const before = tf.memory().numTensors,
      x = tf.tensor3d([1, 2], [1, 2, 1]),
      y = tf.tensor2d([[3]]);
    try {
      for (const constant of [false, true]) {
        const windows: number[][] = [];
        const model = {
          fit: async () => ({ history: { loss: [1] } }),
          predict: (input: tf.Tensor) => {
            const values = Array.from(input.dataSync());
            windows.push(values);
            return tf.tensor2d([[constant ? 7 : values.at(-1)! + 1]]);
          },
        };
        const out = await forecast(x, y, [1, 2], [10, 20, 30], 1, model);
        const expected = feedbackReference(constant);
        expect(out.rollout).toEqual(expected.map((row) => row.rollout));
        expect(out.oneStep).toEqual(expected.map((row) => row.oneStep));
        for (const row of expected) {
          expect(windows).toContainEqual(row.rolloutWindow);
          expect(windows).toContainEqual(row.replayWindow);
        }
      }
    } finally {
      x.dispose();
      y.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("carries actual Kalman variance and verifies stable ensemble weights and ties", () => {
    const Kalman = solution<
      new (
        e: number,
        q: number,
        r: number,
      ) => { estimate: number; variance: number; update(z: number): number }
    >("advanced-time-series", "kalman-filter", "SimpleKalman");
    for (const [q, r] of [
      [0.1, 1],
      [0.5, 0.5],
    ]) {
      const kf = new Kalman(PULSE_INTERVAL_LOG[0]!, q!, r!);
      for (const row of kalmanLogTrace(q!, r!).slice(1)) {
        expect(kf.update(row.measurement)).toBeCloseTo(row.estimate, 12);
        expect(kf.variance).toBeCloseTo(row.variance, 12);
      }
    }
    const gain = solution<
      (
        members: unknown[],
        actual: number[],
      ) => { ensemble: number; weighted: number; beatsBest: boolean }
    >("advanced-time-series", "weighted-ensemble", "ensembleGain");
    const expected = forecastBlendTrace(EVALUATION_MEMBERS, EVALUATION_TARGETS),
      actual = gain(EVALUATION_MEMBERS, EVALUATION_TARGETS);
    expect(actual.ensemble).toBeCloseTo(expected.equalMae, 12);
    expect(actual.weighted).toBeCloseTo(expected.weightedMae, 12);
    expect(actual.beatsBest).toBe(expected.beatsBest);
    const tiny = forecastBlendTrace(
      EVALUATION_MEMBERS.map((member, i) => ({
        ...member,
        heldOutError: (i + 1) * 1e-200,
      })),
      EVALUATION_TARGETS,
    );
    expect(tiny.weights.every(Number.isFinite)).toBe(true);
    expect(tiny.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(
      forecastBlendTrace(
        EVALUATION_MEMBERS.map((member) => ({
          ...member,
          predictions: [37, 39, 38, 40],
        })),
        [36, 38, 37, 39],
      ).beatsBest,
    ).toBe(false);
  });
});

describe("new main-flow code blocks", () => {
  const blocks = [
    [
      "anomaly-detection/01-normal-vs-anomalous.mdx",
      "baseline-distance.js",
      "return [sigmaDistance, sigmaDistance > 3];",
    ],
    [
      "anomaly-detection/01-normal-vs-anomalous.mdx",
      "candidate-baseline.js",
      "return [candidateMean, candidateSpread];",
    ],
    [
      "anomaly-detection/02-autoencoders.mdx",
      "screened-row-selection.js",
      "return keptIndices;",
    ],
    [
      "anomaly-detection/02-autoencoders.mdx",
      "screened-autoencoder.ts",
      "const model = makeScreenedAutoencoder(); const count = model.countParams(); model.dispose(); return count;",
    ],
    [
      "anomaly-detection/03-reconstruction-error.mdx",
      "offset-reconstruction.js",
      "return rowMse;",
    ],
    [
      "anomaly-detection/04-threshold-tuning.mdx",
      "validation-candidate.js",
      "return candidateF1;",
    ],
    [
      "anomaly-detection/05-the-anomaly.mdx",
      "window-vote-trace.ts",
      "return windowBaseline;",
    ],
    [
      "advanced-time-series/01-beyond-lstm.mdx",
      "query-value-trace.js",
      "return valueBlend;",
    ],
    [
      "advanced-time-series/02-temporal-attention.mdx",
      "position-score-trace.ts",
      "return positionalExample;",
    ],
    [
      "advanced-time-series/03-forecasting.mdx",
      "feedback-window-trace.js",
      "return [nextRolloutWindow, nextReplayWindow];",
    ],
    [
      "advanced-time-series/04-kalman-filters.mdx",
      "selected-day-update.js",
      "return [kalmanGain, nextInterval, nextVariance];",
    ],
    [
      "advanced-time-series/05-ensemble-methods.mdx",
      "weights-from-prior.js",
      "return [priorShares, equalPrediction, priorWeightedPrediction];",
    ],
  ] as const;
  it.each(blocks)(
    "executes %s / %s with no retained tensors",
    (file, title, suffix) => {
      const mdx = readFileSync(new URL(file, root), "utf8");
      const block = [
        ...mdx.matchAll(
          /<CodeBlock\b[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`\}\s*<\/CodeBlock>/g,
        ),
      ].find((match) => match[1] === title);
      expect(block, title).toBeDefined();
      const before = tf.memory().numTensors;
      const js = ts.transpileModule(block![2]!, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.None,
        },
      }).outputText;
      const result = new Function("tf", "console", `${js}\n${suffix}`)(tf, {
        log: () => undefined,
      });
      expect(result).toBeDefined();
      expect(tf.memory().numTensors).toBe(before);
      if (title === "baseline-distance.js") expect(result).toEqual([5, true]);
      if (title === "screened-row-selection.js") expect(result).toEqual([0, 2]);
      if (title === "screened-autoencoder.ts") expect(result).toBe(98);
      if (title === "offset-reconstruction.js")
        expect(result).toBeCloseTo(0.01, 12);
      if (title === "validation-candidate.js")
        expect(result).toBeCloseTo(6 / 7, 12);
      if (title === "position-score-trace.ts")
        expect(result.summary[0]).toBeCloseTo(0.3300396, 6);
    },
  );
});

describe("all thirteen shipped exercise Worker paths", () => {
  it.each(exercises)(
    "accepts the canonical %s/%s implementation",
    { timeout: 120_000 },
    async (module, slug) => {
      const item = source(module, slug),
        run = await parseAndRunTests(item.solutionCode, item.testCode);
      expect(run.errored, JSON.stringify(run)).not.toBe(true);
      expect(run.results.length).toBeGreaterThan(0);
      expect(run.results.filter((check) => !check.passed)).toEqual([]);
      expect(run.artifacts?.length).toBeGreaterThan(0);
    },
  );
  it.each([
    ["anomaly-detection", "reconstruction-error"],
    ["advanced-time-series", "simple-attention"],
    ["advanced-time-series", "temporal-attention"],
  ] as const)(
    "rejects a plausible wrong-value or wrong-shape %s/%s result",
    { timeout: 30_000 },
    async (module, slug) => {
      const item = source(module, slug);
      const wrong =
        slug === "reconstruction-error"
          ? "function reconstructionError(){return 0;}"
          : slug === "simple-attention"
            ? "function simpleAttention(q,k,v){return tf.zeros([v.shape[1]]);}"
            : "function temporalAttention(s,w){return {summary:tf.scalar(0),weights:tf.ones([s.shape[0]]).div(s.shape[0])};}";
      const run = await parseAndRunTests(wrong, item.testCode);
      expect(run.results.some((check) => !check.passed)).toBe(true);
    },
  );
});
