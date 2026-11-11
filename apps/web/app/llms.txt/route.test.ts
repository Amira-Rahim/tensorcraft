import { describe, expect, it } from "vitest";
import { exercises, getModules, getWorldLessons } from "@tensorcraft/content";
import { EXERCISE_CONTENT, PRICING } from "@tensorcraft/shared";
import { GET } from "./route";

describe("public source summary", () => {
  it("serves linked plain text with current product facts", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    const text = await response.text();
    const modules = getModules("deep-orbit");
    const lessons = getWorldLessons("deep-orbit");
    const lessonSlugs = new Set(lessons.map((lesson) => lesson.slug));
    const liveExercises = exercises.filter((exercise) =>
      lessonSlugs.has(exercise.lessonSlug),
    );
    expect(liveExercises.length).toBe(EXERCISE_CONTENT.liveExercises);
    expect(text).toContain(
      `${modules.length} modules, ${lessons.length} lessons, ${liveExercises.length} coding exercises`,
    );
    expect(text).toContain(`USD ${PRICING.single.price}`);
    expect(text).toContain(`USD ${PRICING.single.regularPrice}`);
    expect(text).toContain(
      "https://tensorcraft.app/guides/tensorflow-js-reshape-vs-transpose",
    );
    for (const lesson of lessons) {
      const url = `https://tensorcraft.app/worlds/deep-orbit/${lesson.moduleId}/${lesson.slug}`;
      if (
        modules.find((module) => module.slug === lesson.moduleId)?.order === 1
      ) {
        expect(text).toContain(url);
      } else {
        expect(text).not.toContain(url);
      }
    }
  });
});
