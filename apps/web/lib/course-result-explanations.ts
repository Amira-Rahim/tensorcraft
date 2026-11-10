import type { ExerciseArtifact } from "@tensorcraft/ui";
export type CourseResult =
  | { kind: "spectrogram-frames"; labels: string[]; values: number[] }
  | {
      kind: "spectrum-peak";
      samples: number;
      sampleRate: number;
      spacing: number;
      frequency: number;
    }
  | { kind: "composition-output"; values: number[] }
  | { kind: "model-card-output"; lines: string[] };
export const supportsCourseResult = (slug: string) =>
  [
    "build-spectrogram",
    "compute-fft",
    "pipeline-architecture",
    "write-model-card",
  ].includes(slug);
export function readCourseResult(
  slug: string,
  artifacts: ExerciseArtifact[],
): CourseResult | null {
  const title =
    slug === "build-spectrogram"
      ? "When the test tone appears"
      : slug === "compute-fft"
        ? "Your strongest eligible frequency"
        : slug === "pipeline-architecture"
          ? "The feature row your pipeline delivered"
          : slug === "write-model-card"
            ? "The handover card your code produced"
            : null;
  if (!title) return null;
  const found = artifacts.filter((a) => a.title === title);
  if (found.length !== 1) return null;
  const a = found[0]!;
  if (slug === "build-spectrogram") {
    if (
      a.kind !== "series" ||
      a.xLabel !== "Frame start (seconds)" ||
      a.yLabel !== "Raw FFT magnitude at 40 Hz" ||
      JSON.stringify(a.labels) !==
        JSON.stringify(["0", "0.25", "0.5", "0.75"]) ||
      a.series.length !== 1 ||
      a.series[0]!.name !== "Your 40 Hz magnitudes" ||
      a.series[0]!.values.length !== 4 ||
      !a.series[0]!.values.every(
        (v) => typeof v === "number" && Number.isFinite(v) && v >= 0,
      )
    )
      return null;
    return {
      kind: "spectrogram-frames",
      labels: [...a.labels],
      values: [...a.series[0]!.values],
    };
  }

  if (slug === "write-model-card")
    return a.kind === "text" && a.text.trim()
      ? { kind: "model-card-output", lines: a.text.split("\n") }
      : null;
  if (a.kind !== "table") return null;
  if (slug === "compute-fft") {
    if (
      JSON.stringify(a.columns) !== JSON.stringify(["Measurement", "Value"]) ||
      a.rows.length !== 4
    )
      return null;
    const labels = [
      "Samples",
      "Sample rate (Hz)",
      "Bin spacing (Hz)",
      "Returned frequency (Hz)",
    ];
    if (
      !a.rows.every(
        (r, i) =>
          r.length === 2 &&
          r[0] === labels[i] &&
          typeof r[1] === "number" &&
          Number.isFinite(r[1]),
      )
    )
      return null;
    const [samples, sampleRate, spacing, frequency] = a.rows.map(
      (r) => r[1] as number,
    );
    // This capture identifies the one-second 128-sample synthetic probe only.
    if (samples !== 128 || sampleRate !== 128 || spacing !== 1) return null;
    return {
      kind: "spectrum-peak",
      samples,
      sampleRate,
      spacing,
      frequency: frequency!,
    };
  }
  if (
    JSON.stringify(a.columns) !==
      JSON.stringify(["FFT bin", "Magnitude from normalized input"]) ||
    a.rows.length !== 5 ||
    !a.rows.every(
      (r, i) =>
        r.length === 2 &&
        r[0] === i &&
        typeof r[1] === "number" &&
        Number.isFinite(r[1]) &&
        r[1] >= 0,
    )
  )
    return null;
  return {
    kind: "composition-output",
    values: a.rows.map((r) => r[1] as number),
  };
}
