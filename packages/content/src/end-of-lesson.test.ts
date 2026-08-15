import { describe, it, expect } from "vitest";
import { BUILT_WORLD_DIRS, BUILT_STORY_WORLDS } from "./built-worlds";
import { WORLD_SHAPE, type WorldSlug } from "@tensorcraft/shared";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../content");

function lessonMdx(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "exercises") continue;
      out.push(...lessonMdx(full));
    } else if (e.name.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

const files = [...BUILT_WORLD_DIRS].flatMap((d) =>
  lessonMdx(path.join(ROOT, d)),
);

// Expected built-lesson total, summed per-world (re-audit N2/F-A) rather than a
// hardcoded literal: each built story world contributes its own WORLD_SHAPE
// total (deep-orbit 56, others 54/55). Adding a world to BUILT_WORLD_DIRS
// updates this automatically.
const EXPECTED_BUILT_LESSONS = BUILT_STORY_WORLDS.reduce(
  (sum, t) => sum + WORLD_SHAPE[t as WorldSlug].totalLessons,
  0,
);

describe("end-of-lesson migration completeness (built lessons)", () => {
  it("found the built lessons", () => {
    expect(files.length).toBe(EXPECTED_BUILT_LESSONS);
  });

  it.each(files)("%s has the new close and none of the old", (file) => {
    const src = fs.readFileSync(file, "utf-8");
    const recall = (src.match(/<RecallPrompt/g) ?? []).length;
    const recap = (src.match(/<LessonRecap/g) ?? []).length;
    // P2 variance (2026-07-12): dense lessons may carry a second (rarely a
    // third) RecallPrompt; exactly-one was itself a lockstep the structure
    // audit flagged. Zero is still a migration failure, and more than three
    // is quiz creep.
    expect(recall, "1-3 RecallPrompts").toBeGreaterThanOrEqual(1);
    expect(recall, "1-3 RecallPrompts").toBeLessThanOrEqual(3);
    expect(recap, "exactly one LessonRecap").toBe(1);
    expect(src.includes("<Quiz"), "no Quiz").toBe(false);
    expect(src.includes("<KeyTakeaways"), "no KeyTakeaways").toBe(false);
    expect(src.indexOf("<RecallPrompt")).toBeLessThan(
      src.indexOf("<LessonRecap"),
    );
  });
});
