import { describe, it, expect } from "vitest";
import { modules, lessons, exercises } from "../.velite";

describe("Content completeness", () => {
  it("every module has exactly lessonCount lessons", () => {
    for (const mod of modules) {
      const modLessons = lessons.filter(
        (l) => l.moduleId === mod.slug && l.themeId === mod.themeId,
      );
      expect(
        modLessons.length,
        `Module "${mod.slug}" (theme: ${mod.themeId}) has ${modLessons.length} lessons, expected ${mod.lessonCount}`,
      ).toBe(mod.lessonCount);
    }
  });

  it("every lesson has sequential orders within its module", () => {
    for (const mod of modules) {
      const modLessons = lessons.filter(
        (l) => l.moduleId === mod.slug && l.themeId === mod.themeId,
      );
      const orders = modLessons.map((l) => l.order).sort((a, b) => a - b);
      const expected = Array.from({ length: mod.lessonCount }, (_, i) => i + 1);
      expect(
        orders,
        `Module "${mod.slug}" (theme: ${mod.themeId}) has orders [${orders}], expected [${expected}]`,
      ).toEqual(expected);
    }
  });

  it("every exercise references a valid lesson", () => {
    const lessonSlugs = new Set(lessons.map((l) => l.slug));
    for (const ex of exercises) {
      expect(
        lessonSlugs.has(ex.lessonSlug),
        `Exercise "${ex.slug}" references lesson "${ex.lessonSlug}" which does not exist`,
      ).toBe(true);
    }
  });

  it("every lesson slug is unique", () => {
    const slugs = lessons.map((l) => l.slug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(dupes, `Duplicate lesson slugs: ${dupes.join(", ")}`).toEqual([]);
  });

  it("every module slug is unique within its theme", () => {
    const seen = new Set<string>();
    for (const mod of modules) {
      const key = `${mod.themeId}/${mod.slug}`;
      expect(seen.has(key), `Duplicate module: ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("has at least one module", () => {
    expect(modules.length).toBeGreaterThan(0);
  });

  it("has at least one lesson", () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it("has at least one exercise", () => {
    expect(exercises.length).toBeGreaterThan(0);
  });
});
