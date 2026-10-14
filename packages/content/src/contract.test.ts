import { describe, it, expect } from "vitest";
import { lessonSchema, exerciseSchema, moduleSchema } from "./schemas";
import { WORLD_SLUGS } from "@tensorcraft/shared";
import sampleModule from "./fixtures/sample-module.json";
import sampleLessons from "./fixtures/sample-lessons.json";
import sampleExercises from "./fixtures/sample-exercises.json";
import { lessons, exercises, modules } from "../.velite";

// Validate the actual build as well as fixtures. Exact equality detects fields
// that Zod would silently strip when the public schemas lag behind Velite.
describe("Public schemas preserve compiled content", () => {
  it("keeps the STFT code example, including its explanatory block comment", () => {
    const lesson = lessons.find((item) => item.slug === "spectrograms");
    expect(lesson?.body).toContain("function stftMagnitudes");
    expect(lesson?.body).toContain("Short-Time Fourier Transform (STFT)");
    expect(lesson?.body).toContain("tf.signal.stft");
  });

  it("preserves every lesson's authored metadata", () => {
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      const authored = Object.fromEntries(
        Object.entries(lesson).filter(
          ([key]) =>
            ![
              "body",
              "metadata",
              "glossaryTerms",
              "recallPrompts",
              "documentation",
            ].includes(key),
        ),
      );
      expect(lessonSchema.parse(authored)).toEqual(authored);
    }
  });

  it("preserves every exercise", () => {
    expect(exercises.length).toBeGreaterThan(0);
    for (const exercise of exercises) {
      expect(exerciseSchema.parse(exercise)).toEqual(exercise);
    }
  });

  it("preserves every module, including six-lesson modules", () => {
    expect(modules.some((mod) => mod.lessonCount === 6)).toBe(true);
    for (const mod of modules) {
      expect(moduleSchema.parse(mod)).toEqual(mod);
    }
  });
});

describe("Content contract: module", () => {
  it("sample module validates against moduleSchema", () => {
    const result = moduleSchema.safeParse(sampleModule);
    expect(result.success).toBe(true);
  });

  it("module worldId is a valid WORLD_SLUG", () => {
    expect(WORLD_SLUGS).toContain(sampleModule.worldId);
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

  it("all lesson worldIds are valid WORLD_SLUGs", () => {
    sampleLessons.forEach((l) => {
      expect(WORLD_SLUGS).toContain(l.worldId);
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
