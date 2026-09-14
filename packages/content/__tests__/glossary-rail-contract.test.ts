import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GLOSSARY } from "../src/glossary";

/**
 * The glossary rail beside the Takeaways step lists exactly the terms the
 * lesson body underlines (round 7 completeness critic, 2026-09-13).
 *
 * Before this gate the rail came from a whole-word match over the MDX source,
 * so it listed 242 terms across 56 lessons that no reader ever saw as a chip:
 * foundations/normalization carried "attention" off a BossBeat option,
 * signal-processing/windowing-and-overlap carried "decoder" off a Dialogue
 * line about Node's StringDecoder, and training-loop/training-loop carried
 * "stacking" (the ensemble) off "stacking layers". rehype-glossary never sees
 * JSX children or attributes, so none of those was underlined on the page.
 *
 * Sense stays the author's job: an ordinary-English "recall" or "attention"
 * in prose gets the ML chip, so reword such a sentence rather than let the
 * chip teach the wrong meaning. Two were reworded when this gate landed.
 */
interface RailTerm {
  term: string;
  definition: string;
}
interface BuiltLesson {
  slug: string;
  moduleId: string;
  body: string;
  glossaryTerms: RailTerm[];
}

const lessons: BuiltLesson[] = JSON.parse(
  readFileSync(join(__dirname, "..", ".velite", "lessons.json"), "utf8"),
);
const SPAN = /"data-glossary-term":\s*"([^"]+)"/g;
const wrapped = (body: string) => [
  ...new Set([...body.matchAll(SPAN)].map((m) => m[1]!)),
];
const rail = (moduleId: string, slug: string) => {
  const lesson = lessons.find(
    (l) => l.moduleId === moduleId && l.slug === slug,
  );
  if (!lesson) throw new Error(`no built lesson ${moduleId}/${slug}`);
  return lesson.glossaryTerms.map((t) => t.term);
};

describe("glossary rail contract", () => {
  it("builds every launched lesson with at least one underlined term", () => {
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      expect(
        lesson.glossaryTerms.length,
        `${lesson.moduleId}/${lesson.slug} has an empty rail`,
      ).toBeGreaterThan(0);
    }
  });

  it("lists exactly the terms the compiled body underlines, in body order", () => {
    for (const lesson of lessons) {
      expect(
        lesson.glossaryTerms.map((t) => t.term),
        `${lesson.moduleId}/${lesson.slug}`,
      ).toEqual(wrapped(lesson.body));
    }
  });

  it("carries the dictionary's definition for every rail entry", () => {
    const byTerm = new Map(GLOSSARY.map((e) => [e.term, e.definition]));
    for (const lesson of lessons) {
      for (const t of lesson.glossaryTerms) {
        expect(byTerm.get(t.term), `${lesson.slug}: ${t.term}`).toBe(
          t.definition,
        );
      }
    }
  });

  it("keeps the three round-7 contradictions off their rails", () => {
    expect(rail("foundations", "normalization")).not.toContain("attention");
    expect(rail("signal-processing", "windowing-and-overlap")).not.toContain(
      "decoder",
    );
    expect(rail("training-loop", "training-loop")).not.toContain("stacking");
  });
});
