import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
import { LessonInstrument } from "./lesson-instrument";
import { WORKED_PACKET } from "../mdx/channel-layout-data";
import * as tensorExample from "./tensor-example";
import { LESSON_HANDOFFS } from "./lesson-handoffs";
import {
  gradientStep,
  kalmanUpdate,
  magnitudeSpectrum,
  quantize,
  screening,
  softmax,
  teachingSignal,
  trainingTrace,
  FIRST_PACKET,
  NORMALIZATION_ROWS,
} from "./instrument-math";
const root =
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../") + "/";
const lessons = JSON.parse(
  readFileSync(root + "packages/content/.velite/lessons.json", "utf8"),
).filter((l: { worldId: string }) => l.worldId === "deep-orbit") as Array<{
  slug: string;
  moduleId: string;
  scene?: { epilogueLocation?: string };
}>;
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("the complete Deep Orbit visual curriculum", () => {
  it("has a task-specific handoff for every actual lesson", () => {
    expect(Object.keys(LESSON_HANDOFFS).sort()).toEqual(
      lessons.map((l) => l.slug).sort(),
    );
  });
  it("plots the mission readings and lets the learner follow each sensor", async () => {
    const exercises = JSON.parse(
      readFileSync(root + "packages/content/.velite/exercises.json", "utf8"),
    );
    const starter = exercises.find(
      (e: { slug: string }) => e.slug === "create-a-tensor",
    ).starterCode;
    expect(WORKED_PACKET.flat()).toEqual(
      JSON.parse(starter.match(/streamValues = (\[[^\]]+\])/)[1]),
    );
    render(
      <LessonInstrument
        spec={DEEP_ORBIT_VISUALS["introduction-to-tensors"]!}
      />,
    );
    expect(
      screen.queryByRole("region", { name: "Output from your code" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "From your latest run",
      ),
    );
    expect(
      screen.getByRole("img", { name: /Readings over time/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sensor B" }));
    expect(screen.getByRole("button", { name: "Sensor B" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Sensor B, 3: 16")).toBeInTheDocument();
    expect(screen.queryByText("Sensor A, 3: 4")).not.toBeInTheDocument();
    expect(screen.getByText("[12]")).toBeInTheDocument();
  });
  it("allows retry after TensorFlow.js fails without inventing output", async () => {
    const run = vi
      .spyOn(tensorExample, "runTensorExample")
      .mockRejectedValueOnce(new Error("offline"));
    render(
      <LessonInstrument
        spec={DEEP_ORBIT_VISUALS["introduction-to-tensors"]!}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    expect(
      screen.getByRole("button", { name: "Running example…" }),
    ).toBeDisabled();
    expect(run).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "couldn’t draw the chart",
      ),
    );
    expect(
      screen.queryByRole("region", { name: "Output from your code" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "From your latest run",
      ),
    );
  });
  it("does not plot an output whose values do not match the selected recording", async () => {
    vi.spyOn(tensorExample, "runTensorExample").mockResolvedValueOnce({
      shape: [12],
      values: WORKED_PACKET.flat().reverse(),
      chartRows: [
        [2, 3, 4],
        [20, 18, 16],
        [5, 7, 6],
        [8, 8, 9],
      ],
    });
    render(
      <LessonInstrument
        spec={DEEP_ORBIT_VISUALS["introduction-to-tensors"]!}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(
      screen.queryByRole("region", { name: "Output from your code" }),
    ).not.toBeInTheDocument();
  });
  it("uses the normalization exercise's rows and distinguishes raw, z-score and min-max results", () => {
    const exercises = JSON.parse(
      readFileSync(root + "packages/content/.velite/exercises.json", "utf8"),
    );
    const starter = exercises.find(
      (e: { slug: string }) => e.slug === "normalize-data",
    ).starterCode;
    const rows = starter
      .match(/tf.tensor2d\(([\s\S]*?)\);/)[1]
      .replace(/,\s*]/g, "]");
    expect(NORMALIZATION_ROWS).toEqual(JSON.parse(rows));
    render(<LessonInstrument spec={DEEP_ORBIT_VISUALS.normalization!} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "1.000, 1.000, 1.000, 1.000",
    );
    fireEvent.click(screen.getByRole("button", { name: "Z-score" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "0.592, 0.070, 0.674, 0.570",
    );
    fireEvent.click(screen.getByRole("button", { name: "Min-max" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "differs from z-score scaling",
    );
  });
  it("covers exactly the 56 canonical lessons, their modules and their original artwork", () => {
    expect(lessons).toHaveLength(56);
    expect(Object.keys(DEEP_ORBIT_VISUALS).sort()).toEqual(
      lessons.map((l) => l.slug).sort(),
    );
    for (const lesson of lessons) {
      expect(DEEP_ORBIT_VISUALS[lesson.slug]!.module, lesson.slug).toBe(
        lesson.moduleId,
      );
      const base =
        root +
        `apps/web/public/scenes/deep-orbit/${lesson.moduleId}/${lesson.slug}`;
      expect(existsSync(base + ".webp"), lesson.slug).toBe(true);
      if (lesson.scene?.epilogueLocation)
        expect(
          existsSync(base + "-epilogue.webp"),
          lesson.slug + " ending",
        ).toBe(true);
    }
  });
  it.each(Object.entries(DEEP_ORBIT_VISUALS))(
    "%s renders an instrument and an operable, labeled input",
    async (_slug, spec) => {
      render(<LessonInstrument spec={spec} />);
      expect(screen.getByText(spec.action)).toBeInTheDocument();
      expect(screen.getByText(spec.takeaway)).toBeInTheDocument();
      const slider = screen.queryAllByRole("slider")[0];
      const buttons = screen.queryAllByRole("button");
      expect(slider || buttons.length).toBeTruthy();
      const instrument = screen
        .getByText(spec.action)
        .closest("[data-instrument]")!;
      const before = instrument.textContent;
      if (slider) {
        expect(slider).toHaveAccessibleName();
        const input = slider as HTMLInputElement;
        fireEvent.change(slider, {
          target: { value: input.value === input.max ? input.min : input.max },
        });
      } else fireEvent.click(buttons[1] ?? buttons[0]!);
      if (spec.kind === "tensor" && spec.mode === "create") {
        if (slider)
          fireEvent.click(
            screen.getByRole("button", {
              name: "Run example",
            }),
          );
        await waitFor(() =>
          expect(screen.getByRole("status")).toHaveTextContent(
            "From your latest run",
          ),
        );
      }
      expect(instrument.textContent).not.toBe(before);
    },
  );
});
describe("teaching instrument calculations", () => {
  it("makes a useful gradient step and exposes overshooting", () => {
    expect(gradientStep(0.5, 0.5)).toBe(3);
    expect((gradientStep(0.5, 1.2) - 3) ** 2).toBeGreaterThan((0.5 - 3) ** 2);
  });
  it("has a validation minimum before the training trace ends", () => {
    const best = trainingTrace.reduce((a, b) =>
      a.validation < b.validation ? a : b,
    );
    expect(best.epoch).toBeLessThan(24);
    expect(trainingTrace[24]!.train).toBeLessThan(best.train);
    expect(trainingTrace[24]!.validation).toBeGreaterThan(best.validation);
  });
  it("counts mutually exclusive confusion categories and responds to threshold", () => {
    const low = screening(0.1),
      high = screening(0.9),
      middle = screening(0.5);
    expect(low.fn).toBe(0);
    expect(high.fp).toBe(0);
    expect(middle.tp + middle.fp + middle.fn + middle.tn).toBe(12);
    expect(middle).toMatchObject({ tp: 4, fp: 2, fn: 1, tn: 5 });
  });
  it("computes a correctly normalized one-sided spectrum", () => {
    const spectrum = magnitudeSpectrum(teachingSignal(12, 0.6));
    expect(spectrum[4]).toBeCloseTo(1, 10);
    expect(spectrum[12]).toBeCloseTo(0.6, 10);
    expect(spectrum[8]).toBeCloseTo(0, 10);
    expect(magnitudeSpectrum(Array(64).fill(1))[0]).toBeCloseTo(1);
  });
  it("normalizes attention without numerical overflow", () => {
    const weights = softmax([1001, 1002, 1003]);
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(weights[2]).toBeGreaterThan(weights[0]!);
  });
  it("trusts a noisy measurement less", () => {
    expect(kalmanUpdate(10, 14, 4, 4)).toEqual({
      gain: 0.5,
      estimate: 12,
      variance: 2,
    });
    expect(kalmanUpdate(10, 14, 4, 16).estimate).toBeLessThan(12);
  });
  it("quantizes on the displayed level grid with bounded error", () => {
    for (const bits of [2, 3, 8]) {
      const rounded = quantize([-0.83, -0.07, 0.46, 0.91], bits);
      rounded.forEach((v, i) =>
        expect(
          Math.abs(v - [-0.83, -0.07, 0.46, 0.91][i]!),
        ).toBeLessThanOrEqual(1 / (2 ** bits - 1)),
      );
    }
  });
});
