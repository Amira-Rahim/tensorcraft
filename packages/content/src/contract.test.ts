import { describe, it, expect } from "vitest";
import { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";
import { THEME_SLUGS } from "@tensorcraft/shared";
import sampleModule from "./fixtures/sample-module.json";
import sampleLessons from "./fixtures/sample-lessons.json";
import sampleExercises from "./fixtures/sample-exercises.json";

describe("Content contract: module", () => {
  it("sample module validates against moduleSchema", () => {
    const result = moduleSchema.safeParse(sampleModule);
    expect(result.success).toBe(true);
  });

  it("module themeId is a valid THEME_SLUG", () => {
    expect(THEME_SLUGS).toContain(sampleModule.themeId);
  });
});

describe("Content contract: lessons", () => {
  it.each(sampleLessons)(
    "lesson '$slug' validates against lessonSchema",
    (lesson) => {
      const result = lessonSchema.safeParse(lesson);
      expect(result.success).toBe(true);
    },
  );

  it("covers all difficulty levels", () => {
    const difficulties = new Set(sampleLessons.map((l) => l.difficulty));
    expect(difficulties).toContain("beginner");
    expect(difficulties).toContain("intermediate");
    expect(difficulties).toContain("advanced");
  });

  it("covers all bridge tier values", () => {
    const tiers = new Set(
      sampleLessons
        .filter((l) => l.concept.bridge)
        .map((l) => l.concept.bridge!.tier),
    );
    expect(tiers).toContain("identity");
    expect(tiers).toContain("structural");
    expect(tiers).toContain("intuition");
  });

  it("all lesson themeIds are valid THEME_SLUGs", () => {
    sampleLessons.forEach((l) => {
      expect(THEME_SLUGS).toContain(l.themeId);
    });
  });

  it("includes a lesson without bridge (optional field)", () => {
    const noBridge = sampleLessons.filter((l) => !l.concept.bridge);
    expect(noBridge.length).toBeGreaterThan(0);
  });
});

describe("Content contract: exercises", () => {
  it.each(sampleExercises)(
    "exercise '$slug' validates against exerciseSchema",
    (exercise) => {
      const result = exerciseSchema.safeParse(exercise);
      expect(result.success).toBe(true);
    },
  );

  it("covers multiple difficulty levels", () => {
    const difficulties = new Set(sampleExercises.map((e) => e.difficulty));
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });
});
