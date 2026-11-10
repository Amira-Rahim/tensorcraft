// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import { stripTypeScript } from "../../../../../packages/ui/src/mdx/strip-typescript";
import { initialInvestigationValues } from "./investigation-types";
import {
  SIGNAL_TASK_INVESTIGATIONS,
  VIEW_TASK_CASES,
  FFT_TASK_CASES,
  FRAME_TASK_CASES,
  FEATURE_TASK_CASES,
  TAPER_TASK_CASES,
  symmetricHann,
  taskMagnitudes,
  taskFrames,
  taskBand,
} from "./signal-task-investigations";
const root = resolve(
  import.meta.dirname,
  "../../../../../packages/content/content/deep-orbit/signal-processing",
);
beforeAll(async () => {
  expect(tf.version.tfjs).toBe("4.22.0");
  await tf.setBackend("cpu");
  await tf.ready();
});
const mags = (samples: number[]) =>
  tf.tidy(() =>
    Array.from(tf.spectral.rfft(tf.tensor1d(samples)).abs().dataSync()),
  );
function evaluate(
  slug: string,
  changes: Record<string, number> = {},
  id = "standard",
) {
  const spec = SIGNAL_TASK_INVESTIGATIONS[slug]!;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, id), ...changes },
    id,
  );
}
function exercise(slug: string) {
  const source = readFileSync(
    resolve(root, "exercises", `${slug}.yaml`),
    "utf8",
  );
  const field = (name: string, next: string) =>
    source
      .split(`${name}: |\n`)[1]!
      .split(`\n${next}:`)[0]!
      .replace(/^ {2}/gm, "");
  return {
    solution: field("solutionCode", "testCode"),
    tests: field("testCode", "estimatedMinutes"),
  };
}
const clean = (code: string) =>
  stripTypeScript(code).replace(/^import .*?;\s*$/gm, "");
async function execute(file: string, titles: string[]) {
  const source = readFileSync(resolve(root, file), "utf8");
  const all = [
    ...source.matchAll(
      /<CodeBlock language="(?:typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ];
  const snippets = titles.map((title) => {
    const block = all.find(([, name]) => name === title);
    if (!block) throw Error(`Missing ${title}`);
    return clean(new Function("return `" + block[2] + "`;")());
  });
  const before = tf.memory().numTensors;
  const logs: unknown[][] = [];
  await new Function(
    "tf",
    "console",
    `return (async () => {\n${snippets.join("\n")}\n})();`,
  )(tf, {
    log: (...args: unknown[]) => logs.push(args),
    table: (...args: unknown[]) => logs.push(args),
  });
  expect(tf.memory().numTensors).toBe(before);
  return logs;
}

describe("signal reference computations from the supplied checks", () => {
  it("keeps raw one-sided magnitude and input order consistent with pinned TFJS", () => {
    const before = tf.memory().numTensors;
    const captures = [
      ...Object.values(VIEW_TASK_CASES).map((c) => c.samples),
      ...Object.values(FFT_TASK_CASES).map((c) => c.samples),
      ...Object.values(FEATURE_TASK_CASES).map((c) => c.samples),
    ];
    for (const samples of captures) {
      const original = samples.slice();
      const actual = mags(samples);
      const reference = taskMagnitudes(samples);
      expect(reference).toHaveLength(actual.length);
      actual.forEach((value, i) => expect(reference[i]).toBeCloseTo(value, 3));
      expect(samples).toEqual(original);
    }
    expect(tf.memory().numTensors).toBe(before);
  });
  it("compares the first raw-magnitude gap including missing components, DC, silence, and phase changes", () => {
    const compare = new Function(
      "tf",
      `${clean(exercise("time-vs-frequency").solution)}\nreturn compareViews;`,
    )(tf) as (
      a: number[],
      b: number[],
      t: number,
      cutoff: number,
    ) => { timeTwin: boolean; divergentBin: number };
    const components = [
      [5, 0.8],
      [12, 0.6],
      [23, 0.4],
      [47, 0.2],
    ];
    const background = Array.from({ length: 512 }, (_, i) =>
      components.reduce(
        (sum, [hz, a]) => sum + a! * Math.sin((2 * Math.PI * hz! * i) / 256),
        0,
      ),
    );
    const backgroundSpectrum = mags(background);
    for (const id of Object.keys(VIEW_TASK_CASES) as Array<
      keyof typeof VIEW_TASK_CASES
    >) {
      const samples = VIEW_TASK_CASES[id].samples;
      const actualSpectrum = mags(samples);
      for (const threshold of Array.from({ length: 40 }, (_, i) => (i + 1) / 2))
        for (const tolerance of [0.04, 0.05]) {
          const actual = {
            divergentBin: backgroundSpectrum.findIndex(
              (value, i) => Math.abs(value - actualSpectrum[i]!) > threshold,
            ),
            timeTwin: background.every(
              (value, i) => Math.abs(value - samples[i]!) <= tolerance,
            ),
          };
          // Reuse each real TFJS spectrum for the entire slider sweep, then
          // independently run the shipped function at the key cutoffs.
          if ([0.5, 2, 5, 20].includes(threshold)) {
            expect(compare(background, samples, tolerance, threshold)).toEqual(
              actual,
            );
          }
          const result = evaluate(
            "time-vs-frequency",
            { threshold, tolerance },
            id,
          );
          expect(result.answer).toBe(actual.divergentBin);
          const generated = new Function(
            `${result.code}\nreturn { firstDivergentBin, timeTwin };`,
          )();
          expect(generated).toEqual({
            firstDivergentBin: actual.divergentBin,
            timeTwin: actual.timeTwin,
          });
        }
    }
    expect(
      SIGNAL_TASK_INVESTIGATIONS["time-vs-frequency"]!.controls.find(
        (control) => control.id === "threshold",
      ),
    ).toMatchObject({ min: 0.5, max: 20, step: 0.5 });
    expect(evaluate("time-vs-frequency").answer).toBe(147);
    expect(evaluate("time-vs-frequency", { threshold: 2 }).answer).toBe(146);
    expect(evaluate("time-vs-frequency", {}, "changed").answer).toBe(94);
    expect(evaluate("time-vs-frequency", {}, "offset").answer).toBe(0);
    expect(evaluate("time-vs-frequency", {}, "rotated").answer).toBe(-1);
    const atLimit = compare([0, 0, 0, 0], [0.5, 0.5, 0.5, 0.5], 0.5, 2);
    expect(atLimit).toEqual({ timeTwin: true, divergentBin: -1 });
  });
  it("chooses the computed non-DC maximum, retaining the first eligible tie", () => {
    const find = new Function(
      "tf",
      `${clean(exercise("compute-fft").solution)}\nreturn findDominantFrequency;`,
    )(tf) as (signal: number[], rate: number) => number;
    for (const [id, item] of Object.entries(FFT_TASK_CASES)) {
      const actual = find(item.samples, item.rate);
      for (const bin of [0, 1, item.samples.length / 2]) {
        const result = evaluate("fourier-transform", { bin }, id);
        expect(result.answer).toBe(actual);
        const generated = new Function(
          `${result.code}\nreturn { frequency, selectedFrequency };`,
        )();
        expect(generated.frequency).toBe(actual);
        expect(generated.selectedFrequency).toBe(
          (bin * item.rate) / item.samples.length,
        );
      }
    }
    expect(evaluate("fourier-transform", {}, "changed").answer).toBe(7);
    expect(evaluate("fourier-transform", {}, "offBin").answer).toBe(7);
    expect(evaluate("fourier-transform", {}, "silence").answer).toBe(2);
    expect(evaluate("fourier-transform", {}, "tied").answer).toBe(2);
  });
  it("keeps complete rectangular frames and their original timing, including a missing-frame result", () => {
    for (const [id, item] of Object.entries(FRAME_TASK_CASES))
      for (const size of [64, 128])
        for (const hop of [32, 64]) {
          const rows = taskFrames(
            id as keyof typeof FRAME_TASK_CASES,
            size,
            hop,
          );
          const count = Math.max(
            0,
            1 + Math.floor((item.samples.length - size) / hop),
          );
          expect(rows).toHaveLength(count);
          rows.forEach((row, i) => {
            const actual = mags(item.samples.slice(i * hop, i * hop + size));
            expect(row).toHaveLength(size / 2 + 1);
            actual.forEach((value, bin) =>
              expect(row[bin]).toBeCloseTo(value, 3),
            );
          });
          const result = evaluate(
            "spectrograms",
            { window: size, hop, frame: 0, bin: 10 },
            id,
          );
          expect(result.answer).toBe(count);
          expect(new Function(`${result.code}\nreturn rows;`)()).toBe(count);
        }
    const burst = taskFrames("standard", 64, 64).map((row) => row[10]);
    [0, 32, 0, 0].forEach((value, i) => expect(burst[i]).toBeCloseTo(value, 3));
    const overlap = taskFrames("standard", 64, 32).map((row) => row[10]);
    [0, 16, 32, 16, 0, 0, 0].forEach((value, i) =>
      expect(overlap[i]).toBeCloseTo(value, 3),
    );
  });
  it("maps every selected raw feature to the authored transform without sorting or rescaling", () => {
    const extract = new Function(
      "tf",
      `${clean(exercise("fft-features").solution)}\nreturn extractFeatures;`,
    )(tf) as (
      signal: number[],
      rate: number,
      lo: number,
      hi: number,
    ) => number[];
    for (const [id, item] of Object.entries(FEATURE_TASK_CASES))
      for (const band of [0, 1, 2]) {
        const [lo, hi] = taskBand(item.rate, band);
        const actual = extract(item.samples, item.rate, lo, hi);
        for (let feature = 0; feature < actual.length; feature++) {
          const result = evaluate("fft-as-features", { feature, band }, id);
          expect(result.answer).toBeCloseTo(actual[feature]!, 3);
          expect(
            new Function(`${result.code}\nreturn selectedValue;`)(),
          ).toBeCloseTo(actual[feature]!, 3);
        }
      }
    const row = extract(FEATURE_TASK_CASES.standard.samples, 256, 50, 82);
    expect(row).toHaveLength(10);
    expect(row[0]).toBeCloseTo(1.467, 2);
    expect(row[1]).toBe(25);
    expect(row[2]).toBeCloseTo(32, 3);
    expect(row[7]).toBeCloseTo(16, 3);
    expect(extract([-2, 0, 3, -4], 8, 0, 4)[1]).toBe(1);
  });
  it("matches symmetric weights, elementwise products, and the exact far-bin magnitude definition", () => {
    expect(symmetricHann(2)).toEqual([0, 0]);
    expect(symmetricHann(9)[4]).toBe(1);
    for (const [id, item] of Object.entries(TAPER_TASK_CASES)) {
      const weights = symmetricHann(item.samples.length);
      const weighted = item.samples.map((value, i) => value * weights[i]!);
      const before = mags(item.samples),
        after = mags(weighted);
      const far = (values: number[]) =>
        values.reduce(
          (total, value, bin) =>
            total + (Math.abs(bin - Math.round(item.cycles)) > 3 ? value : 0),
          0,
        );
      expect(far(before) / far(after)).toBeGreaterThan(20);
      for (const sample of [
        0,
        Math.floor(item.samples.length / 4),
        item.samples.length - 1,
      ])
        for (const taper of [0, 1]) {
          const result = evaluate(
            "windowing-and-overlap",
            { sample, taper },
            id,
          );
          expect(result.answer).toBeCloseTo(
            taper ? weighted[sample]! : item.samples[sample]!,
            10,
          );
          expect(
            new Function(`${result.code}\nreturn weightedSample;`)(),
          ).toBeCloseTo(Number(result.answer), 10);
          const metrics = result.graphics[6]!.values;
          expect(metrics[1]).toBeCloseTo(far(before), 2);
          if (taper) expect(metrics[2]).toBeCloseTo(far(after), 2);
        }
    }
  });
});

describe("required authored signal examples", () => {
  it("runs the capture-pair comparison with no retained tensors", async () => {
    const logs = await execute("01-time-vs-frequency.mdx", ["capture-pair.ts"]);
    expect(logs[0]![0]).toMatchObject({
      samples: 512,
      binWidthHz: 0.5,
      bin: 147,
      centerHz: 73.5,
    });
    expect(
      (logs[0]![0] as { rawMagnitudeGap: number }).rawMagnitudeGap,
    ).toBeCloseTo(11.96, 1);
    expect(logs[1]![0]).toBeCloseTo(0.05, 5);
  });
  it("runs the raw selected frame, ten-field feature probe, and symmetric taper", async () => {
    const frame = await execute("03-spectrograms.mdx", [
      "one-frame-spectrum.ts",
    ]);
    expect(frame[0]![0]).toMatchObject({
      startSample: 64,
      endExclusive: 128,
      startSeconds: 0.25,
      bins: 33,
      magnitudeAt40Hz: 32,
    });
    const feature = await execute("04-fft-as-features.mdx", [
      "feature-row-probe.ts",
    ]);
    expect(feature[0]![0]).toMatchObject({ strictCrossings: 25 });
    expect((feature[1]![0] as number[])[0]).toBeCloseTo(32, 3);
    expect((feature[1]![0] as number[])[5]).toBeCloseTo(16, 3);
    const taper = await execute("05-windowing-and-overlap.mdx", [
      "symmetric-hann-probe.ts",
    ]);
    expect(taper[0]![0]).toEqual([0, 0]);
    expect((taper[1]![0] as { reduction: number }).reduction).toBeGreaterThan(
      20,
    );
  });
});

describe("the signal exercise checks", () => {
  it.each([
    "time-vs-frequency",
    "compute-fft",
    "build-spectrogram",
    "fft-features",
    "apply-window",
  ])("accepts the existing solution for %s", async (slug) => {
    const { solution, tests } = exercise(slug);
    const result = await parseAndRunTests(solution, tests);
    expect(result.errored).not.toBe(true);
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
  });
  it.each([
    [
      "time-vs-frequency",
      "Math.abs(magsA[i] - magsB[i])",
      "magsB[i] - magsA[i]",
      "detects a missing frequency",
    ],
    [
      "compute-fft",
      "let maxBin = 1;\n    let maxMag = magnitudes[1];",
      "let maxBin = 0;\n    let maxMag = magnitudes[0];",
      "skips the DC component",
    ],
    [
      "compute-fft",
      "return (maxBin * sampleRate) / signal.length;",
      "return maxBin;",
      "converts the bin to hertz",
    ],
    [
      "compute-fft",
      "magnitudes[i] > maxMag",
      "magnitudes[i] >= maxMag",
      "first eligible bin",
    ],
    [
      "build-spectrogram",
      "tf.tensor1d(chunk)",
      "tf.tensor1d(chunk).mul(tf.signal.hannWindow(chunk.length))",
      "steady tone peaks",
    ],
    ["fft-features", "v * signal[i - 1] < 0", "v * signal[i - 1] <= 0", "zero"],
    ["apply-window", "(n - 1)", "n", "last sample no weight"],
  ])(
    "rejects %s with %s changed",
    async (slug, original, replacement, failing) => {
      const { solution, tests } = exercise(slug);
      const wrong = solution.replace(original, replacement);
      expect(wrong).not.toBe(solution);
      const result = await parseAndRunTests(wrong, tests);
      expect(
        result.results.some(
          (check) => !check.passed && check.name.includes(failing),
        ),
      ).toBe(true);
    },
  );
});
