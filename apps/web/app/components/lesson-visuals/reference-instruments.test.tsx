import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as tf from "@tensorflow/tfjs";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
import { LessonInstrument } from "./lesson-instrument";
import {
  DETECTOR_BASELINE,
  detectorVoteExample,
  magnitudeSpectrum,
  screening,
  teachingSignal,
} from "./instrument-math";

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});
afterEach(cleanup);
const reference = (slug: string) =>
  render(<LessonInstrument spec={DEEP_ORBIT_VISUALS[slug]!} />);
const code = () =>
  screen.getByLabelText("JavaScript for this example").textContent!;

describe("audited optional reference instruments", () => {
  it("uses the strict alert threshold in its classifications", () => {
    expect(screening(0.41).cells[2]!.category).toBe("FN");
    expect(screening(0.4).cells[2]!.category).toBe("TP");
    expect(screening(0.67).cells[4]!.category).toBe("TN");
    expect(screening(0.66).cells[4]!.category).toBe("FP");
    reference("evaluating-deep-scan");
    expect(code()).toContain(" > ");
    expect(code()).not.toContain(">=");
  });

  it("keeps recurrent-state precision in the code shown for a later step", () => {
    reference("simple-rnns");
    fireEvent.change(
      screen.getByRole("slider", { name: "Current time index" }),
      { target: { value: "5" } },
    );
    const generated = new Function(`${code()}\nreturn h;`)();
    const expected = tf.tidy(() => {
      let state: tf.Tensor = tf.scalar(0);
      for (const input of [2, 4, 3, 6, 5, 8])
        state = state
          .mul(0.7)
          .add((0.5 * input) / 10)
          .tanh();
      return state.dataSync()[0];
    });
    expect(generated).toBeCloseTo(expected!, 6);
  });

  it("shows the actual next gradient calculation after several steps", () => {
    reference("gradient-descent");
    const button = screen.getByRole("button", { name: "Take a gradient step" });
    for (let i = 0; i < 4; i++) fireEvent.click(button);
    const generated = new Function(`${code()}\nreturn nextWeight;`)();
    const weight = 3 + (0.5 - 3) * (1 - 2 * 0.3) ** 4;
    expect(generated).toBeCloseTo(weight - 0.3 * 2 * (weight - 3), 12);
  });

  it("selects the actual temporal reference stages and pools the original two features", () => {
    reference("temporal-attention");
    const attach = screen.getByRole("button", {
      name: /Attach normalized position/,
    });
    const score = screen.getByRole("button", { name: /Score and normalize/ });
    const pool = screen.getByRole("button", { name: /Pool original features/ });
    expect(attach).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("status", { name: "Reference result" }),
    ).toHaveTextContent("One row uses position zero");
    const attachCode = code();
    fireEvent.click(score);
    expect(attach).toHaveAttribute("aria-pressed", "false");
    expect(score).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("status", { name: "Reference result" }),
    ).toHaveTextContent("supplied scorer is [1, 0, 0.5]");
    const scoreCode = code();
    fireEvent.click(pool);
    expect(pool).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("status", { name: "Reference result" }),
    ).toHaveTextContent("Keep a one-feature summary as [1]");
    const poolCode = code();
    const before = tf.memory().numTensors;
    const actual = tf.tidy(() => {
      const sequence = tf.tensor2d([
        [0, 4],
        [0.25, 2],
        [0.5, 0],
      ]);
      const positions = tf.linspace(0, 1, 3).reshape([3, 1]);
      const scorer = tf.tensor2d([[1], [0], [0.5]]);
      const result = new Function(
        "tf",
        "sequence",
        "positions",
        "scorer",
        "T",
        `${attachCode}\n${scoreCode}\n${poolCode}\nreturn summary;`,
      )(tf, sequence, positions, scorer, 3) as tf.Tensor;
      expect(result.shape).toEqual([2]);
      return Array.from(result.dataSync());
    });
    expect(actual[0]).toBeCloseTo(0.3300396, 6);
    expect(actual[1]).toBeCloseTo(1.3596866, 6);
    expect(tf.memory().numTensors).toBe(before);
  });

  it("selects the actual detector reference stages and distinguishes supplied evidence from computed moments", () => {
    reference("the-anomaly");
    const baseline = screen.getByRole("button", {
      name: /Compute window baseline/,
    });
    const cutoffs = screen.getByRole("button", {
      name: /Compare separate cutoffs/,
    });
    const count = screen.getByRole("button", { name: /Count votes/ });
    const status = screen.getByRole("status", { name: "Reference result" });
    expect(baseline).toHaveAttribute("aria-pressed", "true");
    expect(status).toHaveTextContent(
      "this supplied window, not the eleven-day archive baseline",
    );
    const baselineCode = code();
    fireEvent.click(cutoffs);
    expect(baseline).toHaveAttribute("aria-pressed", "false");
    expect(cutoffs).toHaveAttribute("aria-pressed", "true");
    expect(status).toHaveTextContent("Reconstruction receives error 6.2");
    expect(status).toHaveTextContent(
      "supplied amplitude forecast misses by 0.3",
    );
    expect(status).toHaveTextContent("different units");
    const cutoffCode = code();
    fireEvent.click(count);
    expect(count).toHaveAttribute("aria-pressed", "true");
    expect(status).toHaveTextContent("no finite z-score");
    const countCode = code();
    const before = tf.memory().numTensors;
    const actual = tf.tidy(() => {
      const windowTensor = tf.tensor1d(DETECTOR_BASELINE);
      return new Function(
        "tf",
        "windowTensor",
        `${baselineCode}\nconst forecast = 0.2, actual = 0.5, forecastCutoff = 0.1;\n${cutoffCode}\nconst z = (actual - moments.mean.dataSync()[0]) / Math.sqrt(moments.variance.dataSync()[0]);\nconst flags = [Math.abs(z) > 3, 6.2 > 1, forecastFlag];\n${countCode}\nreturn { flags, alert };`,
      )(tf, windowTensor) as { flags: boolean[]; alert: boolean };
    });
    expect(actual).toEqual({ flags: [false, true, true], alert: true });
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches the shared detector baseline to real population moments", () => {
    const expected = tf.tidy(() => {
      const { mean, variance } = tf.moments(tf.tensor1d(DETECTOR_BASELINE));
      return [mean.dataSync()[0], Math.sqrt(variance.dataSync()[0]!)];
    });
    const result = detectorVoteExample(0.5, 6.2, 0.2);
    expect(result.mean).toBeCloseTo(expected[0]!, 6);
    expect(result.std).toBeCloseTo(expected[1]!, 6);
    expect(result.flags).toEqual([false, true, true]);
    expect(result.votes).toBe(2);
  });

  it("keeps FFT feature column meanings fixed while the tone moves", () => {
    reference("fft-as-features");
    const extract = () =>
      new Function("magnitudes", `${code()}\nreturn { fixedBins, features };`)(
        magnitudeSpectrum(
          teachingSignal(
            Number((screen.getByRole("slider") as HTMLInputElement).value),
            0.6,
          ),
        ),
      );
    const first = extract();
    expect(first.fixedBins).toEqual([4, 12, 20]);
    expect(first.features[1]).toBeCloseTo(0.6, 10);
    fireEvent.change(
      screen.getByRole("slider", { name: "Second tone frequency (Hz)" }),
      { target: { value: "20" } },
    );
    const moved = extract();
    expect(moved.fixedBins).toEqual([4, 12, 20]);
    expect(moved.features[1]).toBeCloseTo(0, 10);
    expect(moved.features[2]).toBeCloseTo(0.6, 10);
    expect(
      screen.getByRole("status", { name: "Reference result" }),
    ).toHaveTextContent("Feature columns always read 4, 12 and 20 Hz");
  });

  it("compares its normalized spectrum with TFJS rFFT including DC and Nyquist", () => {
    const signal = Array.from(
      { length: 64 },
      (_, i) =>
        0.3 +
        Math.cos(Math.PI * i) * 0.2 +
        Math.sin((2 * Math.PI * 12 * i) / 64) * 0.6,
    );
    const expected = tf.tidy(() =>
      Array.from(tf.abs(tf.spectral.rfft(tf.tensor1d(signal))).dataSync()),
    );
    const actual = magnitudeSpectrum(signal);
    actual.forEach((value, bin) =>
      expect(value).toBeCloseTo(
        (expected[bin]! / 64) * (bin === 0 || bin === 32 ? 1 : 2),
        6,
      ),
    );
    expect(actual[0]).toBeCloseTo(0.3, 6);
    expect(actual[32]).toBeCloseTo(0.2, 6);
  });

  it("explains manual best-weight restoration in the illustrative training trace", () => {
    reference("training-loop");
    fireEvent.change(screen.getByRole("slider", { name: "Inspect epoch" }), {
      target: { value: "24" },
    });
    expect(
      screen.getByRole("status", { name: "Reference result" }),
    ).toHaveTextContent("TFJS 4.22 early stopping keeps the final weights");
    expect(
      screen.getByRole("status", { name: "Reference result" }),
    ).toHaveTextContent("Save and restore the best checkpoint separately");
  });
});
