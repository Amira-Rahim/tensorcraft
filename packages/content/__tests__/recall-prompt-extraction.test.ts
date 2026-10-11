import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";

/**
 * Every <RecallPrompt> in a built lesson's source must survive into its
 * built `recallPrompts` array (2026-09-16).
 *
 * Scoped to BUILT_WORLD_DIRS on purpose. terra-grid/ab-testing/05 carries 3
 * prompts and is not in the velite build, so an unscoped scan compares 85
 * raw tags against 82 built entries and is red on day one.
 *
 * The count gate catches prompts missing literal question or answer props.
 * Structured checks are validated by the MDX parser during extraction.
 */
interface BuiltLesson {
  slug: string;
  moduleId: string;
  recallPrompts: Array<{ index: number; question: string; answer: string }>;
}

const lessons: BuiltLesson[] = JSON.parse(
  readFileSync(join(__dirname, "..", ".velite", "lessons.json"), "utf8"),
);

const CONTENT_ROOT = join(__dirname, "..", "content");
const TAG = /<RecallPrompt\b/g;

interface SourceLesson {
  moduleId: string;
  slug: string;
  tags: number;
  /** Raw MDX, kept so the verbatim check below can match against the source. */
  raw: string;
}

const sources: SourceLesson[] = [];
for (const world of BUILT_WORLD_DIRS) {
  const worldDir = join(CONTENT_ROOT, world);
  for (const mod of readdirSync(worldDir, { withFileTypes: true })) {
    if (!mod.isDirectory()) continue;
    const modDir = join(worldDir, mod.name);
    for (const file of readdirSync(modDir)) {
      if (!file.endsWith(".mdx")) continue;
      const mdx = readFileSync(join(modDir, file), "utf8");
      const slug = mdx.match(/^slug: (.*?)\s*$/m)?.[1];
      const moduleId = mdx.match(/^moduleId: (.*?)\s*$/m)?.[1];
      if (!slug || !moduleId) throw new Error(`no slug in ${modDir}/${file}`);
      sources.push({
        moduleId,
        slug,
        tags: [...mdx.matchAll(TAG)].length,
        raw: mdx,
      });
    }
  }
}

describe("recall prompt extraction", () => {
  it("scans every built lesson's source", () => {
    expect(sources.length).toBe(lessons.length);
  });

  it("extracts every authored prompt in the built worlds", () => {
    const authored = sources.reduce((sum, s) => sum + s.tags, 0);
    const extracted = lessons.reduce(
      (sum, l) => sum + (l.recallPrompts?.length ?? 0),
      0,
    );
    expect(authored).toBeGreaterThan(0);
    expect(extracted).toBe(authored);
  });

  for (const source of sources) {
    it(`${source.moduleId}/${source.slug} keeps all ${source.tags} of its prompts`, () => {
      const built = lessons.find(
        (l) => l.moduleId === source.moduleId && l.slug === source.slug,
      );
      expect(
        built,
        `no built lesson ${source.moduleId}/${source.slug}`,
      ).toBeDefined();
      expect(
        built!.recallPrompts?.length ?? 0,
        `${source.moduleId}/${source.slug} authors ${source.tags} <RecallPrompt> tags but built ${built!.recallPrompts?.length ?? 0}. A tag whose question or answer is not a double-quoted string prop is dropped by parseRecallPrompts.`,
      ).toBe(source.tags);
    });
  }

  it("carries non-empty text on every extracted prompt", () => {
    for (const lesson of lessons) {
      for (const prompt of lesson.recallPrompts ?? []) {
        expect(
          prompt.question.trim().length,
          `${lesson.moduleId}/${lesson.slug} prompt ${prompt.index} has an empty question`,
        ).toBeGreaterThan(0);
        expect(
          prompt.answer.trim().length,
          `${lesson.moduleId}/${lesson.slug} prompt ${prompt.index} has an empty answer`,
        ).toBeGreaterThan(0);
      }
    }
  });

  /*
    Counting is not enough. The count matches whenever the right NUMBER of
    prompts comes out, including when a tag swallowed a sibling's attribute
    and carried off the wrong answer. That matters more here than it would
    elsewhere: a later surface renders this text to a learner on a different
    lesson's page, where they have no way to notice it does not match what
    they were taught.

    Matching against the raw source also pins entity handling. JSX decodes
    entities in a string attribute (`answer="A &amp; B"` renders "A & B")
    while the parser extracts the literal. No prompt carries an entity today,
    so if one is ever authored this fails and the decision gets made
    deliberately rather than shipping a visible mismatch.
  */
  it("extracts text that appears verbatim in the lesson source", () => {
    for (const source of sources) {
      const built = lessons.find(
        (l) => l.moduleId === source.moduleId && l.slug === source.slug,
      );
      for (const prompt of built?.recallPrompts ?? []) {
        expect(
          source.raw,
          `${source.moduleId}/${source.slug} prompt ${prompt.index}: extracted question is not in the source verbatim`,
        ).toContain(prompt.question);
        expect(
          source.raw,
          `${source.moduleId}/${source.slug} prompt ${prompt.index}: extracted answer is not in the source verbatim`,
        ).toContain(prompt.answer);
      }
    }
  });
});

/* Review payloads require literal question and answer props. The UI also
   supports children, but authored lessons must use the extractable form. */
describe("recall prompts use the string-prop form only", () => {
  it("has no closing </RecallPrompt> tag anywhere in the built worlds", () => {
    const offenders = sources
      .filter((s) => s.raw.includes("</RecallPrompt>"))
      .map((s) => `${s.moduleId}/${s.slug}`);
    expect(
      offenders,
      "author reviewable prompts with literal question= and answer= string props",
    ).toEqual([]);
  });
});

/*
  The recall card renders its question and answer as plain text: ProseText
  only links character names, so a markdown backtick reaches the learner as
  a literal "`" (lesson 2's question showed one around [8, 224, 224, 3] until
  2026-10-10). The question is already set in a code font, so write code
  without backticks here.
*/
describe("recall prompts are plain text", () => {
  it("carries no markdown backticks in any question or answer", () => {
    const offenders = lessons.flatMap((lesson) =>
      (lesson.recallPrompts ?? [])
        .filter((prompt) => `${prompt.question} ${prompt.answer}`.includes("`"))
        .map(
          (prompt) =>
            `${lesson.moduleId}/${lesson.slug} prompt ${prompt.index}`,
        ),
    );
    expect(
      offenders,
      "the recall card shows a backtick literally; write the code without it",
    ).toEqual([]);
  });
});
