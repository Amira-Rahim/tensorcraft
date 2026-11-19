// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { orderedLessonExercises } from "./lesson-exercise-order";
const content = resolve("packages/content");
const lessons = JSON.parse(
  readFileSync(resolve(content, ".velite/lessons.json"), "utf8"),
) as { worldId: string; moduleId: string; slug: string; body: string }[];
const exercises = JSON.parse(
  readFileSync(resolve(content, ".velite/exercises.json"), "utf8"),
) as { slug: string; title: string; lessonSlug: string }[];
describe("authored task outline order", () => {
  it("matches every Deep Orbit MDX Exercise reference even when the collection order is reversed", () => {
    let references = 0;
    for (const lesson of lessons.filter((l) => l.worldId === "deep-orbit")) {
      const directory = resolve(content, "content/deep-orbit", lesson.moduleId);
      const source = readdirSync(directory)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => readFileSync(resolve(directory, f), "utf8"))
        .find((s) => s.match(/^slug: (.+)$/m)?.[1] === lesson.slug)!;
      const authored = [...source.matchAll(/<Exercise\s+slug="([^"]+)"/g)].map(
        (m) => m[1],
      );
      const actual = orderedLessonExercises(
        lesson.body,
        exercises.filter((e) => e.lessonSlug === lesson.slug).reverse(),
      );
      expect(
        actual.map((e) => e.slug),
        lesson.slug,
      ).toEqual(authored);
      references += actual.length;
    }
    expect(references).toBe(65);
  });
  it("ignores unknown and repeated props", () => {
    expect(
      orderedLessonExercises('slug:"b",slug:"unknown",slug:"b",slug:"a"', [
        { slug: "a", title: "First" },
        { slug: "b", title: "Second" },
      ]).map((e) => e.title),
    ).toEqual(["Second", "First"]);
  });
});
