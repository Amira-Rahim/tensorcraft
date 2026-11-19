import { describe, expect, it } from "vitest";
import { readLessonResultExplanation } from "./lesson-result-explanations";
import { courseResultFixtures as fixtures } from "../app/components/__fixtures__/course-results";
describe("known signal, composition and card captures", () => {
  it.each(Object.keys(fixtures))(
    "decodes %s and rejects missing or duplicate roles",
    (slug) => {
      expect(readLessonResultExplanation(slug, fixtures[slug])).not.toBeNull();
      expect(readLessonResultExplanation(slug, [])).toBeNull();
      expect(
        readLessonResultExplanation(slug, [
          ...fixtures[slug]!,
          ...fixtures[slug]!,
        ]),
      ).toBeNull();
    },
  );
  it("rejects other source geometry and nonfinite values", () => {
    const spectral = structuredClone(fixtures["build-spectrogram"]!);
    if (spectral[0]!.kind === "series") spectral[0]!.labels[1] = "1";
    expect(
      readLessonResultExplanation("build-spectrogram", spectral),
    ).toBeNull();
    const peak = structuredClone(fixtures["compute-fft"]!);
    if (peak[0]!.kind === "table") peak[0]!.rows[0]![1] = 256;
    expect(readLessonResultExplanation("compute-fft", peak)).toBeNull();
    const pipeline = structuredClone(fixtures["pipeline-architecture"]!);
    if (pipeline[0]!.kind === "table") pipeline[0]!.rows[0]![1] = NaN;
    expect(
      readLessonResultExplanation("pipeline-architecture", pipeline),
    ).toBeNull();
  });
  it("preserves a wrong finite returned value instead of replacing it with a reference", () => {
    const capture = structuredClone(fixtures["pipeline-architecture"]!);
    if (capture[0]!.kind === "table") capture[0]!.rows[2]![1] = 99;
    const decoded = readLessonResultExplanation(
      "pipeline-architecture",
      capture,
    );
    expect(decoded?.kind === "composition-output" && decoded.values[2]).toBe(
      99,
    );
  });
});
