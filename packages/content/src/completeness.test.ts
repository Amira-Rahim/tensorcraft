import { describe, it, expect } from "vitest";
import { modules, lessons, exercises } from "../.velite";

describe("Content completeness", () => {
  it("every module has exactly 5 lessons", () => {
    for (const mod of modules) {
      const modLessons = lessons.filter(
        (l) => l.themeId === mod.themeId && l.moduleId === mod.slug,
      );
      expect(
        modLessons.length,
        `Module "${mod.slug}" (theme: ${mod.themeId}) should have 5 lessons but has ${modLessons.length}`,
      ).toBe(5);
    }
  });

  it("every lesson has orders 1-5 within its module", () => {
    for (const mod of modules) {
      const modLessons = lessons
        .filter((l) => l.themeId === mod.themeId && l.moduleId === mod.slug)
        .map((l) => l.order)
        .sort((a, b) => a - b);

      expect(
        modLessons,
        `Module "${mod.slug}" (theme: ${mod.themeId}) lessons should have orders [1,2,3,4,5]`,
      ).toEqual([1, 2, 3, 4, 5]);
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
});
