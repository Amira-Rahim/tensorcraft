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
  softmax,
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

  it("adds position to temporal reference scores and pools original values", () => {
    reference("temporal-attention");
    fireEvent.change(screen.getByRole("slider", { name: "Scalar query" }), {
      target: { value: "0" },
    });
    const position = screen.getByRole("slider", {
      name: "Reference position weight",
    });
    const keys = [-1, -0.4, 0.2, 0.7, 1.2],
      values = [2, 7, 3, 8, 4];
    for (const coefficient of [-2, 2]) {
      fireEvent.change(position, { target: { value: String(coefficient) } });
      const result = new Function(
        "keys",
        "values",
        "softmax",
        "sum",
        `${code()}\nreturn { context, weights };`,
      )(keys, values, softmax, (a: number[]) => a.reduce((s, v) => s + v, 0));
      const maximum = result.weights.indexOf(Math.max(...result.weights));
      expect(maximum).toBe(coefficient > 0 ? 4 : 0);
      const expected = tf.tidy(
        () =>
          tf
            .softmax(tf.tensor1d(keys.map((_, t) => (coefficient * t) / 4)))
            .mul(tf.tensor1d(values))
            .sum()
            .dataSync()[0],
      );
      expect(result.context).toBeCloseTo(expected!, 6);
    }
  });

  it("uses true detector inputs and changes votes independently", () => {
    reference("the-anomaly");
    const status = screen.getByRole("status", { name: "Reference result" });
    expect(status).toHaveTextContent("2 of 3 votes: alert selected");
    fireEvent.change(
      screen.getByRole("slider", {
        name: "Autoencoder error in this reference",
      }),
      { target: { value: "0.1" } },
    );
    expect(status).toHaveTextContent("1 of 3 votes: no alert selected");
    fireEvent.change(
      screen.getByRole("slider", {
        name: "Forecast amplitude in this reference",
      }),
      { target: { value: "0.5" } },
    );
    expect(status).toHaveTextContent("0 of 3 votes: no alert selected");
    fireEvent.change(
      screen.getByRole("slider", { name: "Amplitude in this reference" }),
      { target: { value: "0.9" } },
    );
    fireEvent.change(
      screen.getByRole("slider", {
        name: "Forecast amplitude in this reference",
      }),
      { target: { value: "0.9" } },
    );
    expect(status).toHaveTextContent("1 of 3 votes: no alert selected");
    expect(status).toHaveTextContent(
      "supplies fixed autoencoder error and forecast values",
    );
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
