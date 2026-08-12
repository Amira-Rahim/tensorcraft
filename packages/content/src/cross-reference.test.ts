import { describe, it, expect } from "vitest";
import { WORLD_SLUGS } from "@tensorcraft/shared";
import sampleModule from "./fixtures/sample-module.json";
import sampleLessons from "./fixtures/sample-lessons.json";
import sampleExercises from "./fixtures/sample-exercises.json";

const modules = [sampleModule];
const lessons = sampleLessons;
const exercises = sampleExercises;

const moduleSlugs = new Set(modules.map((m) => m.slug));
const lessonSlugs = new Set(lessons.map((l) => l.slug));

describe("Cross-reference integrity", () => {
  it("every exercise.lessonSlug references an existing lesson", () => {
    exercises.forEach((ex) => {
      expect(lessonSlugs.has(ex.lessonSlug)).toBe(true);
    });
  });

  it("every lesson.moduleId references an existing module", () => {
    lessons.forEach((l) => {
      expect(moduleSlugs.has(l.moduleId)).toBe(true);
    });
  });

  it("no duplicate slugs across lessons", () => {
    expect(lessonSlugs.size).toBe(lessons.length);
  });

  it("no duplicate slugs across exercises", () => {
    const exSlugs = new Set(exercises.map((e) => e.slug));
    expect(exSlugs.size).toBe(exercises.length);
  });

  it("lesson order values are sequential within each module", () => {
    const byModule: Record<string, typeof lessons> = {};
    lessons.forEach((l) => {
      if (!byModule[l.moduleId]) byModule[l.moduleId] = [];
      byModule[l.moduleId].push(l);
    });

    Object.values(byModule).forEach((group) => {
      const orders = group.map((l) => l.order).sort((a, b) => a - b);
      orders.forEach((o, i) => expect(o).toBe(i + 1));
    });
  });

  it("module prerequisites reference valid module slugs", () => {
    modules.forEach((m) => {
      m.prerequisites.forEach((prereq: string) => {
        expect(moduleSlugs.has(prereq)).toBe(true);
      });
    });
  });

  it("every lesson worldId is a valid WORLD_SLUG", () => {
    lessons.forEach((l) => {
      expect(WORLD_SLUGS as readonly string[]).toContain(l.worldId);
    });
  });

  it("module has exactly 5 lessons", () => {
    modules.forEach((m) => {
      const moduleLessons = lessons.filter((l) => l.moduleId === m.slug);
      expect(moduleLessons.length).toBe(m.lessonCount);
    });
  });
});
