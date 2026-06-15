import { describe, it, expect } from "vitest";
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

const files = ["deep-orbit", "extras"].flatMap((d) =>
  lessonMdx(path.join(ROOT, d)),
);

describe("end-of-lesson migration completeness (built lessons)", () => {
  it("found the built lessons", () => {
    expect(files.length).toBe(77);
  });

  it.each(files)("%s has the new close and none of the old", (file) => {
    const src = fs.readFileSync(file, "utf-8");
    const recall = (src.match(/<RecallPrompt/g) ?? []).length;
    const recap = (src.match(/<LessonRecap/g) ?? []).length;
    expect(recall, "exactly one RecallPrompt").toBe(1);
    expect(recap, "exactly one LessonRecap").toBe(1);
    expect(src.includes("<Quiz"), "no Quiz").toBe(false);
    expect(src.includes("<KeyTakeaways"), "no KeyTakeaways").toBe(false);
    expect(src.indexOf("<RecallPrompt")).toBeLessThan(
      src.indexOf("<LessonRecap"),
    );
  });
});
